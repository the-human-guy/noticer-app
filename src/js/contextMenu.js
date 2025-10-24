Alpine.data('contextMenu', () => ({
  contextMenuActiveItemId: null,
  contextMenuData: null,

  openMenu(elId, menuRef, arbitraryData) {
    this.contextMenuActiveItemId = elId;
    this.contextMenuData = arbitraryData

    menuRef.onDidDismiss().then(() => {
      this.contextMenuActiveItemId = null
      this.contextMenuData = null
    })
  }
}))

/*
  Usage example:


 <template x-for="file in $store.Files.items">
    <ion-button
      :id="'list-btn-' + file.name"
      @click="openMenu($event.target.id, $refs.contextMenuRef)"
    ></ion-button>
  </template>

  <ion-popover
    x-ref="contextMenuRef"
    :trigger="contextMenuActiveItemId"
    dismiss-on-select="true"
    show-backdrop="false"
    :is-open="!!contextMenuActiveItemId"
  >
    <ion-content>

    </ion-content>
  </ion-popover>

*/