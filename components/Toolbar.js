const Toolbar = (props) => {
    return `
        <header class=header id=header>
            <div id=progress-bar class=progress-bar></div>
            <a href="/" class="nav icon">山</a>
            <div class="buttons right">
            <div class=tools style="transform-origin: 0 0;">
                <div class=row>
                <a id=tool-1 class="tool selected" tool="camera">
                    <i class="fal fa-camera"></i>
                    <div class=label>Camera tool [ESC]</div>
                </a>
                <a id=tool-2 class="tool" tool="firstperson">
                    <i class="fal fa-eye"></i>
                    <div class=label>First person [V]</div>
                </a>
                <a id=tool-3 class="tool" tool="thirdperson">
                    <i class="fal fa-walking"></i>
                    <div class=label>Third person [B]</div>
                </a>
                <a id=tool-4 class="tool" tool="isometric">
                    <i class="fal fa-cubes"></i>
                    <div class=label>Isometric view [N]</div>
                </a>
                <a id=tool-5 class="tool" tool="birdseye">
                    <i class="fal fa-feather-alt"></i>
                    <div class=label>Birds eye view [M]</div>
                </a>
                </div>
            </div>
            <div class=bar></div>
            <div class=weapons style="transform-origin: 0 0;">
                <div class=row>
                <a id=weapon-1 class="weapon selected" weapon="unarmed">
                    <i class="fal fa-hand-paper"></i>
                    <div class=label>Empty hand [1]</div>
                </a>
                <a id=weapon-2 class="weapon" weapon="rifle">
                    <i class="fal fa-scythe"></i>
                    <div class=label>Rifle [2]</div>
                </a>
                <a id=weapon-3 class="weapon" weapon="grenade">
                    <i class="fal fa-bomb"></i>
                    <div class=label>Grenade [3]</div>
                </a>
                <a id=weapon-4 class="weapon" weapon="pickaxe">
                    <i class="fal fa-axe"></i>
                    <div class=label>Pickaxe [4]</div>
                </a>
                <a id=weapon-5 class="weapon" weapon="shovel">
                    <i class="fal fa-shovel"></i>
                    <div class=label>Shovel [5]</div>
                </a>
                <a id=weapon-6 class="weapon" weapon="build">
                    <i class="fal fa-map"></i>
                    <div class=label>Build [6]</div>
                </a>
                <a id=weapon-7 class="weapon" weapon="things">
                    <i class="fal fa-store"></i>
                    <div class=label>Things [7]</div>
                </a>
                <a id=weapon-8 class="weapon" weapon="shapes">
                    <i class="fal fa-cube"></i>
                    <div class=label>Shapes [8]</div>
                </a>
                <a id=weapon-9 class="weapon" weapon="colors">
                    <i class="fal fa-palette"></i>
                    <div class=label>Colors [9]</div>
                </a>
                <a id=weapon-10 class="weapon" weapon="inventory">
                    <i class="fal fa-backpack"></i>
                    <div class=label>Inventory [10]</div>
                </a>
                <a id=weapon-11 class="weapon" weapon="light">
                    <i class="fal fa-bolt"></i>
                    <div class=label>Light [11]</div>
                </a>
                <a id=weapon-12 class="weapon" weapon="pencil">
                    <i class="fal fa-pencil"></i>
                    <div class=label>Pencil [12]</div>
                </a>
                <a id=weapon-13 class="weapon" weapon="paintbrush">
                    <i class="fal fa-brush"></i>
                    <div class=label>Paintbrush [13]</div>
                </a>
                <a id=weapon-14 class="weapon" weapon="physics">
                    <i class="fal fa-raygun"></i>
                    <div class=label>Physics [14]</div>
                </a>
                <a id=weapon-15 class="weapon" weapon="select">
                    <i class="fal fa-mouse-pointer"></i>
                    <div class=label>Select [TAB]</div>
                </a>
                </div>
            </div>
            <div class=bar></div>
            <div class=functions style="transform-origin: 0 0;">
                <div class=row>
                <a class="function">
                    <i class="fal fa-file-plus">
                    <input type=file class=hidden id=load-package-input>
                    </i>
                    <div class=label>Add file</div>
                </a>
                <a class="function">
                    <i class="fal fa-text"></i>
                    <div class=label>Add text</div>
                </a>
                </div>
            </div>
            <div class=bar></div>
            <div class=functions style="transform-origin: 0 0;">
                <div class=row>
                <a class="function" id=mic-button>
                    <i class="fal fa-microphone"></i>
                    <div class=label>Microphone</div>
                </a>
                <a class="function" id=enter-xr-button>
                    <i class="fal fa-vr-cardboard"></i>
                    <div class=label>Enter XR</div>
                </a>
                </div>
            </div>
            <div class=bar></div>
            <div class=functions style="transform-origin: 0 0;">
                <div class=row>
                <a class="function" id=connectButton>
                    <i class="fal fa-wifi"></i>
                    <div class=label>Connect</div>
                </a>
                </div>
            </div>
            </div>
            <div class=spacer></div>
            <form id=login-form></form>
        </header>
    `;
}
export default Toolbar;