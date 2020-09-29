const Toolbar = (props) => {
    return `
        <div id="twoD-toolbar">
            <a href="/" class="nav icon">山</a>
            <button title="Camera tool [ESC]">
                <i class="fal fa-camera"></i>
            </button>
            <button title="First person [V]">
                <i class="fal fa-eye"></i>
            </button>
            <button title="Third person [B]">
                <i class="fal fa-walking"></i>
            </button>
            <button title="Isometric view [N]">
                <i class="fal fa-cubes"></i>
            </button>
            <button title="Birds eye view [M]">
                <i class="fal fa-feather-alt"></i>
            </button>
            <button title="Empty hand [1]">
                <i class="fal fa-hand-paper"></i>
            </button>
            <button title="Rifle [2]">
                <i class="fal fa-scythe"></i>
            </button>
            <button title="Grenade [3]">
                <i class="fal fa-bomb"></i>
            </button>
            <button title="Pickaxe [4]">
                <i class="fal fa-axe"></i>
            </button>
            <button title="Shovel [5]">
                <i class="fal fa-shovel"></i>
            </button>
            <button title="Build [6]">
                <i class="fal fa-map"></i>
            </button>
            <button title="Things [7]">
                <i class="fal fa-store"></i>
            </button>
            <button title="Shapes [8]">
                <i class="fal fa-cube"></i>
            </button>
            <button title="Colors [9]">
                <i class="fal fa-palette"></i>
            </button>
            <button title="Inventory [10]">
                <i class="fal fa-backpack"></i>
            </button>
            <button title="Light [11]">
                <i class="fal fa-bolt"></i>
            </button>
            <button title="Pencil [12]">
                <i class="fal fa-pencil"></i>   
            </button>
            <button title="Paintbrush [13]">
                <i class="fal fa-brush"></i>
            </button>
            <button title="Physics [14]">
                <i class="fal fa-raygun"></i>
            </button>
            <button title="Select [TAB]">
                <i class="fal fa-mouse-pointer"></i>
            </button>
            <button title="Add file">
                <i class="fal fa-file-plus"></i>
                <input type=file id=load-package-input>
            </button>
            <button title="Add text">
                <i class="fal fa-text"></i>
            </button>
            <button title="Microphone">
                <i class="fal fa-microphone"></i>
            </button>
            <button title="Enter XR">
                <i class="fal fa-vr-cardboard"></i>
            </button>
            <button title="Connect">
                <i class="fal fa-wifi"></i>
            </button>
        </div>
    `;
}
export default Toolbar;