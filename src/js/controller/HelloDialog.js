sap.ui.define([
    'sap/ui/base/Object',
], (Object) => {
    'use strict';

    return Object.extend('sap.ui.demo.wt.controller.HelloDialog', {
        getDialog() {
            // create dialog lazily
            if (!this.oDialog) {
                // create dialog via fragment factory
                this.oDialog = sap.ui.xmlfragment('sap.ui.demo.wt.view.HelloDialog', this);
            }
            return this.oDialog;
        },

        open(oView) {
            const oDialog = this.getDialog();

            // connect dialog to view (models, lifecycle)
            oView.addDependent(oDialog);

            // open dialog
            oDialog.open();
        },

        onCloseDialog() {
            this.getDialog().close();
        },
    });
});
