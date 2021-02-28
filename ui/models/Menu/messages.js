
export default {
  nothingToEquip: [
    `\
      <i class="icon fa fa-user-ninja"></i>
      <div class=wrap>
        <div class=label>Nothing to Equip</div>
        <div class=text>
          Please select an item to equip.
        </div>
        <div class=close-button>✕</div>
      </div>
    `,
    {timeout: 5000},
  ],

  nothingToSpawn: [
    `\
      <i class="icon fa fa-user-ninja"></i>
      <div class=wrap>
        <div class=label>Nothing to Spawn</div>
        <div class=text>
          Please select an item to spawn.
        </div>
        <div class=close-button>✕</div>
      </div>
    `,
    {timeout: 5000},
  ],

  changingAvatar: [
    `\
      <i class="icon fa fa-user-ninja"></i>
      <div class=wrap>
        <div class=label>Getting changed</div>
        <div class=text>
          The system is updating your avatar...
        </div>
        <div class=close-button>✕</div>
      </div>
    `,
    {timeout: Infinity},
  ],

  changedAvatar: [
    `\
      <i class="icon fa fa-user-ninja"></i>
      <div class=wrap>
        <div class=label>All done!</div>
        <div class=text>
          Your avatar has been updated.
        </div>
        <div class=close-button>✕</div>
      </div>
    `,
    {timeout: 5000},
  ],
};
