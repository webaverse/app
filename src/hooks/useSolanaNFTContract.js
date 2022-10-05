import { handleBlobUpload } from '../../util.js';
import { registerLoad } from '../LoadingBox.jsx';
import { useEffect, useState, useContext } from 'react';
import { Buffer } from 'buffer';
import SolanaNFTMintIdl from '../abis/SolanaNFTMint.json'

import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import {
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  createInitializeMintInstruction,
  MINT_SIZE,
} from "@solana/spl-token";

import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import * as solanaWeb3 from '@solana/web3.js';
import { programs } from '@metaplex/js';
import axios from "axios"

const { metadata: { Metadata } } = programs

export default function useSolanaNFTContract(currentAccount) {
  const [minting, setMinting] = useState(false);
  const [error, setError] = useState('');

  const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey(
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
  );

  const SOL_MINT_NFT_PROGRAM_ID = new anchor.web3.PublicKey(
    "BUZVwXZm1v7bbJ8epdr3UcThXK3wpN1y1HTXpnJAivhd"
  );

  const uploadMetadata = async (currentApp, previewImage) => {
    try {
      let imageURI;
      let avatarURI;
      const name = currentApp.name;
      const ext = currentApp.appType;
      const description = currentApp.description;
      const metadataFileName = `${name}-metadata.json`;
      if (previewImage) { // 3D object
        imageURI = previewImage;
        avatarURI = currentApp.contentId;
      } else { // image object
        imageURI = currentApp.contentId;
        avatarURI = '';
      }

      imageURI = "https://webaverse.github.io/uzi/";
      console.log("metada", imageURI, name)

      let metadata = {
        "name": "",
        "description": "",
        "attributes": [
        ],
        "properties": {
          "category": "image",
          "creators": [
            {
              "address": `${currentAccount}`,
              "share": 100
            }
          ]
        },
        "image": "",
        "animation_url": ""
      }

      metadata.image = imageURI;
      metadata.animation_url = imageURI;
      metadata.name = name;
      metadata.description = description;

      const type = 'upload';
      let load = null;
      const json_hash = await handleBlobUpload(metadataFileName, new Blob([JSON.stringify(metadata)], { type: 'text/plain' }), {
        onTotal(total) {
          load = registerLoad(type, metadataFileName, 0, total);
        },
        onProgress(e) {
          if (load) {
            load.update(e.loaded, e.total);
          } else {
            load = registerLoad(type, metadataFileName, e.loaded, e.total);
          }
        },
      });
      if (load) {
        load.end();
      }
      return json_hash;
    } catch (err) {
      console.error('metadata upload is failed', err);
      return null;
    }
  }

  const getMetadata = async (mintAccount) => {
    return (
      await anchor.web3.PublicKey.findProgramAddress(
        [
          Buffer.from("metadata"),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          mintAccount.toBuffer(),
        ],
        TOKEN_METADATA_PROGRAM_ID
      )
    )[0];
  }

  async function mintSolanaNFT(currentApp, previewImage, callback = () => { }, afterminting = () => { }) {
    /* upload metadata to the IPFS */
    let metadata_url = await uploadMetadata(currentApp, previewImage);
    let token_name = currentApp.name;
    if (!metadata_url)
      return false;

    /* solana minting start */
    setMinting(true);
    setError('');
    /* set anchor provider */
    const wallet = new PhantomWalletAdapter();
    wallet.connect();
    const connection = new anchor.web3.Connection(
      "https://api.mainnet-beta.solana.com",
      "confirmed"
    )
    // const connection = new anchor.web3.Connection(
    //   "https://solana-api.projectserum.com",
    //   "confirmed"
    // )
    const provider = new anchor.AnchorProvider(connection, wallet);
    anchor.setProvider(provider);

    const program = new Program(
      SolanaNFTMintIdl,
      SOL_MINT_NFT_PROGRAM_ID,
      provider
    );
    console.log("Program Id: ", program.programId.toBase58());
    console.log("Mint Size: ", MINT_SIZE, connection, wallet);

    const lamports = await program.provider.connection.getMinimumBalanceForRentExemption(MINT_SIZE);
    const getMetadata = async (mint) => {
      return (
        await anchor.web3.PublicKey.findProgramAddress(
          [
            Buffer.from("metadata"),
            TOKEN_METADATA_PROGRAM_ID.toBuffer(),
            mint.toBuffer(),
          ],
          TOKEN_METADATA_PROGRAM_ID
        )
      )[0];
    };

    const mintKey = anchor.web3.Keypair.generate();
    const nftTokenAccount = await getAssociatedTokenAddress(
      mintKey.publicKey,
      provider.wallet.publicKey
    );
    console.log("NFT Account: ", nftTokenAccount.toBase58());

    const mint_tx = new anchor.web3.Transaction().add(
      anchor.web3.SystemProgram.createAccount({
        fromPubkey: provider.wallet.publicKey,
        newAccountPubkey: mintKey.publicKey,
        space: MINT_SIZE,
        programId: TOKEN_PROGRAM_ID,
        lamports,
      }),
      createInitializeMintInstruction(
        mintKey.publicKey,
        0,
        provider.wallet.publicKey,
        provider.wallet.publicKey
      ),
      createAssociatedTokenAccountInstruction(
        provider.wallet.publicKey,
        nftTokenAccount,
        provider.wallet.publicKey,
        mintKey.publicKey
      )
    );
    let blockhashObj = await connection.getLatestBlockhash();
    console.log("blockhashObj", blockhashObj);
    mint_tx.recentBlockhash = blockhashObj.blockhash;

    try {
      const signature = await provider.wallet.sendTransaction(mint_tx, connection, {
        signers: [mintKey],
      });
      blockhashObj = await connection.getLatestBlockhash();
      await connection.confirmTransaction(signature, "confirmed");
      // await connection.confirmTransaction({
      //   blockhash: blockhashObj.blockhash,
      //   lastValidBlockHeight: blockhashObj.lastValidBlockHeight,
      //   signature,
      // });
    } catch (err) {
      console.log("sign failed", err)
      return false;
    }

    console.log("Mint key: ", mintKey.publicKey.toString());
    console.log("User: ", provider.wallet.publicKey.toString());

    const metadataAddress = await getMetadata(mintKey.publicKey);
    console.log("Metadata address: ", metadataAddress.toBase58());

    blockhashObj = await connection.getLatestBlockhash();
    try {
      const tx = program.transaction.mintNft(
        mintKey.publicKey,
        token_name,
        "Assest",
        metadata_url,
        {
          accounts: {
            mintAuthority: provider.wallet.publicKey,
            mint: mintKey.publicKey,
            tokenAccount: nftTokenAccount,
            tokenProgram: TOKEN_PROGRAM_ID,
            metadata: metadataAddress,
            tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
            payer: provider.wallet.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          },
        }
      );
      const signature = await wallet.sendTransaction(tx, connection);
      // await connection.confirmTransaction(signature, "confirmed");

      await connection.confirmTransaction({
        blockhash: blockhashObj.blockhash,
        lastValidBlockHeight: blockhashObj.lastValidBlockHeight,
        signature,
      });

      console.log("Mint Success!");
    } catch (err) {
      console.log("transaction failed", err)
    }
  }

  async function getNFTTokens() {
    const solana = new solanaWeb3.Connection("https://api.mainnet-beta.solana.com");

    //the public solana address
    const accountPublicKey = new solanaWeb3.PublicKey(
      "ATHWHJSJuqBgFuD6zq1hCD4za7EnQYYWY9uCgtBUFWyD"
    );

    //mintAccount = the token mint address
    const mintAccount = new solanaWeb3.PublicKey(
      "BUZVwXZm1v7bbJ8epdr3UcThXK3wpN1y1HTXpnJAivhd"
    );
    const account = await solana.getTokenAccountsByOwner(accountPublicKey, {
      mint: mintAccount
    });

    console.log("mint account", account.value[0].pubkey.toString());

  }

  async function getNftsForOwner(symbol) {
    const wallet = new PhantomWalletAdapter();
    wallet.connect();
    const connection = new anchor.web3.Connection(
      "https://api.mainnet-beta.solana.com",
      "confirmed"
    )
    // const connection = new anchor.web3.Connection(
    //   "https://solana-api.projectserum.com",
    //   "confirmed"
    // )
    let tokenInfos = [];
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(wallet.publicKey, { programId: TOKEN_PROGRAM_ID });

    for (let index = 0; index < tokenAccounts.value.length; index++) {
      try {
        const tokenAccount = tokenAccounts.value[index];
        const tokenAmount = tokenAccount.account.data.parsed.info.tokenAmount;
        console.log("token info", index, tokenAccount)
        if (tokenAmount.amount == "1" && tokenAmount.decimals == "0") {   // tokenAmount == 1 means NFT.
          let nftMint = new solanaWeb3.PublicKey(tokenAccount.account.data.parsed.info.mint)
          let pda = await getMetadata(nftMint)
          const accountInfo = await connection.getParsedAccountInfo(pda);

          let metadata = new Metadata(wallet.publicKey.toString(), accountInfo.value)
          // console.log("metadata account info", metadata)
          if (metadata.data.data.symbol == symbol) {
            const tokenMetadata = await axios.get(metadata.data.data.uri)
            const tokenInfo = {
              tokenId: tokenAccount.pubkey.toString(),
              name: tokenMetadata.data.name,
              image: tokenMetadata.data.image
            }
            tokenInfos.push(tokenInfo)
            console.info("token addr", tokenInfo)
          }
        }
      } catch (err) {
        continue;
      }
    }

    return tokenInfos;

  }

  return {
    mintSolanaNFT,
    getNFTTokens,
    getNftsForOwner
  }
}
