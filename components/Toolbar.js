const Toolbar = (props) => {
    return `
        <div id="twoD-toolbar">
            <button class="toolbarBtn" title="Camera tool [ESC]" name="camera" value="false">
                <i class="fal fa-camera"></i>
            </button>
            <button class="toolbarBtn" title="First person [V]" name="firstPerson" value="false">
                <i class="fal fa-eye"></i>
            </button>
            <button class="toolbarBtn" title="Third person [B]" name="thirdPerson" value="false">
                <i class="fal fa-walking"></i>
            </button>
            <button class="toolbarBtn" title="Isometric view [N]" name="isometric" value="false">
                <i class="fal fa-cubes"></i>
            </button>
            <button class="toolbarBtn" title="Birds eye view [M]" name="birdsEye" value="false">
                <i class="fal fa-feather-alt"></i>
            </button>
            <button class="toolbarBtn" title="Empty hand [1]" name="emptyHand" value="false">
                <i class="fal fa-hand-paper"></i>
            </button>
            <button class="toolbarBtn" title="Rifle [2]" name="rifle" value="false">
                <i class="fal fa-scythe"></i>
            </button>
            <button class="toolbarBtn" title="Grenade [3]" name="grenade" value="false">
                <i class="fal fa-bomb"></i>
            </button>
            <button class="toolbarBtn" title="Pickaxe [4]" name="pickaxe" value="false">
                <i class="fal fa-axe"></i>
            </button>
            <button class="toolbarBtn" title="Shovel [5]" name="shovel" value="false">
                <i class="fal fa-shovel"></i>
            </button>
            <button class="toolbarBtn" title="Build [6]" name="build" value="false">
                <i class="fal fa-map"></i>
            </button>
            <button class="toolbarBtn" title="Things [7]" name="things" value="false">
                <i class="fal fa-store"></i>
            </button>
            <button class="toolbarBtn" title="Shapes [8]" name="shapes" value="false">
                <i class="fal fa-cube"></i>
            </button>
            <button class="toolbarBtn" title="Colors [9]" name="colors" value="false">
                <i class="fal fa-palette"></i>
            </button>
            <button class="toolbarBtn" title="Inventory [10]" name="rifle" value="false">
                <i class="fal fa-backpack"></i>
            </button>
            <button class="toolbarBtn" title="Light [11]" name="light" value="false">
                <i class="fal fa-bolt"></i>
            </button>
            <button class="toolbarBtn" title="Pencil [12]" name="pencil" value="false">
                <i class="fal fa-pencil"></i>   
            </button>
            <button class="toolbarBtn" title="Paintbrush [13]" name="paintbrush" value="false">
                <i class="fal fa-brush"></i>
            </button>
            <button class="toolbarBtn" title="Physics [14]" name="physics" value="false">
                <i class="fal fa-raygun"></i>
            </button>
            <button class="toolbarBtn" title="Select [TAB]" name="select" value="false">
                <i class="fal fa-mouse-pointer"></i>
            </button>
            <button class="toolbarBtn" title="Add file" name="addFile" value="false">
                <i class="fal fa-file-plus"></i>
                <input type=file id=load-package-input hidden>
            </button>
            <button class="toolbarBtn" title="Add text" name="addText" value="false">
                <i class="fal fa-text"></i>
            </button>
            <button class="toolbarBtn" title="Microphone" name="micrphone" value="false">
                <i class="fal fa-microphone"></i>
            </button>
            <button class="toolbarBtn" title="Enter XR" name="enterXR" value="false">
                <i class="fal fa-vr-cardboard"></i>
            </button>
            <button class="toolbarBtn" title="Connect" name="connect" value="false">
                <i class="fal fa-wifi"></i>
            </button>
        </div>
    `;
}
export default Toolbar;