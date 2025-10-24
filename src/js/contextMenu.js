Alpine.data('contextMenu', () => ({
  contextMenuActiveItemId: null,
  openMenu(elId, menu) {
    this.contextMenuActiveItemId = elId;
    menu.onDidDismiss().then(() => { this.contextMenuActiveItemId = false })
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