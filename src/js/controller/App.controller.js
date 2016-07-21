sap.ui.define([
    'sap/ui/core/mvc/Controller',
], (Controller) => {
    'use strict';

    return Controller.extend('sap.ui.demo.wt.controller.App', {
        onOpenDialog() {
            this.getOwnerComponent().helloDialog.open(this.getView());
        },
    });
});
