import React, {useEffect} from 'react';
import style from './DragAndDrop.module.css';
import {uploadFile, proxifyUrl, } from '../util.js';
// import {} from '../io-manager.js';
import {registerIoEventHandler, unregisterIoEventHandler} from './IoHandler.jsx';

const _handleUpload = async (item, transform = null) => {
  console.log('uploading...');
  
  const _uploadObject = async item => {
    let u;
    
    if (item instanceof FileList) {
      const formData = new FormData();

      formData.append(
        '',
        new Blob([], {
          type: 'application/x-directory',
        }),
        ''
      );

      const files = item;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        /* const file = await new Promise((accept, reject) => {
          entry.file(accept, reject);
        }); */
        const fullPath = file.name;
        // console.log('file full path', entry.fullPath, rootEntry.fullPath, fullPath);

        formData.append(fullPath, file, fullPath);
      }

      const uploadFilesRes = await fetch(`https://ipfs.webaverse.com/`, {
        method: 'POST',
        body: formData,
      });
      const hashes = await uploadFilesRes.json();

      const rootDirectory = hashes.find(h => h.name === '');
      const rootDirectoryHash = rootDirectory.hash;
      u = `https://ipfs.webaverse.com/ipfs/${rootDirectoryHash}/`;
      // console.log(u);
    } else {
      const file = item.getAsFile();
      const entry = item.webkitGetAsEntry();
      
      if (item.kind === 'string') {
        const s = await new Promise((accept, reject) => {
          item.getAsString(accept);
        });
        const j = JSON.parse(s);
        const {token_id, asset_contract} = j;
        const {address} = asset_contract;
        
        if (contractNames[address]) {
          u = `/@proxy/` + encodeURI(`eth://${address}/${token_id}`);
        } else {
          console.log('got j', j);
          const {traits} = j;
          // cryptovoxels wearables
          const voxTrait = traits.find(t => t.trait_type === 'vox'); // XXX move to a loader
          if (voxTrait) {
            const {value} = voxTrait;
            u = _proxifyUrl(value) + '?type=vox';
          } else {
            const {token_metadata} = j;
            // console.log('proxify', token_metadata);
            const res = await fetch(_proxifyUrl(token_metadata), {
              mode: 'cors',
            });
            const j2 = await res.json();
            // console.log('got metadata', j2);
            
            // dcl wearables
            if (j2.id?.startsWith('urn:decentraland:')) {
              // 'urn:decentraland:ethereum:collections-v1:mch_collection:mch_enemy_upper_body'
              const res = await fetch(`https://peer-lb.decentraland.org/lambdas/collections/wearables?wearableId=${j2.id}`, { // XXX move to a loader
                mode: 'cors',
              });
              const j3 = await res.json();
              const {wearables} = j3;
              const wearable = wearables[0];
              const representation = wearable.data.representations[0];
              const {mainFile, contents} = representation;
              const file = contents.find(f => f.key === mainFile);
              const match = mainFile.match(/\.([a-z0-9]+)$/i);
              const type = match && match[1];
              // console.log('got wearable', {mainFile, contents, file, type});
              u = '/@proxy/' + encodeURI(file.url) + (type ? ('?type=' + type) : '');
            } else {
              // avatar
              const {avatar_url, asset} = j2;
              const avatarUrl = avatar_url || asset;
              if (avatarUrl) {
                u = '/@proxy/' + encodeURI(avatarUrl) + '?type=vrm';
              } else {
                // default
                const {image} = j2;
                u = '/@proxy/' + encodeURI(image);
              }
            }
          }
        }
      } else if (entry.isDirectory) {
        const formData = new FormData();
        
        const rootEntry = entry;
        const _recurse = async entry => {
          function getFullPath(entry) {
            return entry.fullPath.slice(rootEntry.fullPath.length);
          }
          const fullPath = getFullPath(entry);
          // console.log('directory full path', entry.fullPath, rootEntry.fullPath, fullPath);
          formData.append(
            fullPath,
            new Blob([], {
              type: 'application/x-directory',
            }),
            fullPath
          );
          
          const reader = entry.createReader();
          async function readEntries() {
            const entries = await new Promise((accept, reject) => {
              reader.readEntries(entries => {
                if (entries.length > 0) {
                  accept(entries);
                } else {
                  accept(null);
                }
              }, reject);
            });
            return entries;
          }
          let entriesArray;
          while (entriesArray = await readEntries()) {
            for (const entry of entriesArray) {
              if (entry.isFile) {
                const file = await new Promise((accept, reject) => {
                  entry.file(accept, reject);
                });
                const fullPath = getFullPath(entry);
                console.log('file full path', entry.fullPath, rootEntry.fullPath, fullPath);

                formData.append(fullPath, file, fullPath);
              } else if (entry.isDirectory) {
                await _recurse(entry);
              }
            }
          } 
        };
        await _recurse(rootEntry);

        const uploadFilesRes = await fetch(`https://ipfs.webaverse.com/`, {
          method: 'POST',
          body: formData,
        });
        const hashes = await uploadFilesRes.json();

        const rootDirectory = hashes.find(h => h.name === '');
        const rootDirectoryHash = rootDirectory.hash;
        u = `https://ipfs.webaverse.com/ipfs/${rootDirectoryHash}/`;
        console.log(u);
      } else {
        const {name, hash} = await _uploadFile(`https://ipfs.webaverse.com/`, file);

        u = `${storageHost}/${hash}/${name}`;
      }
      return u;
    }
  };
  const u = await _uploadObject(item);
  
  console.log('upload complete:', u);

  /* if (!transform) {
    const {leftHand: {position, quaternion}} = metaversefileApi.useLocalPlayer();
    const position2 = position.clone()
      .add(localVector2.set(0, 0, -1).applyQuaternion(quaternion));
    const quaternion2 = quaternion.clone();
    transform = {
      position: position2,
      quaternion: quaternion2,
    };
  }
  const {position, quaternion} = transform;
  
  world.appManager.addTrackedApp(u, position, quaternion, oneVector); */
};
/* const bindUploadFileInput = uploadFileInput => {
  bindUploadFileButton(uploadFileInput, _handleUpload);
}; */

const _upload = () => {
  const input = document.createElement('input');
  input.type = 'file';
  // input.setAttribute('webkitdirectory', '');
  // input.setAttribute('directory', '');
  input.setAttribute('multiple', '');
  // document.body.appendChild(input);
  input.click();
  input.addEventListener('change', e => {
    _handleUpload(e.target.files);
  });
  
  // const uploadFileInput = document.getElementById('upload-file-input');
  // uploadFileInput && uploadFileInput.click();
};

const DragAndDrop = () => {
  useEffect(() => {
    function keydown(e) {
      if (e.which === 85) { // U
        _upload();
      }
    }
    registerIoEventHandler('keydown', keydown);
    return () => {
      unregisterIoEventHandler('keydown');
    };
  }, []);

  return (
    <div className={style.dragAndDrop}>
      
    </div>
  );
};
export {
  DragAndDrop,
};