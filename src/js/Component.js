sap.ui.define([
    'sap/ui/core/UIComponent',
    'sap/ui/model/json/JSONModel',
    'sap/ui/demo/wt/controller/HelloDialog',
    'sap/ui/model/resource/ResourceModel',
], (UIComponent, JSONModel, HelloDialog, ResourceModel) => {
    'use strict';

    const invoice = {
        Invoices: [{
            ProductName: 'Pineapple',
            Quantity: 21,
            ExtendedPrice: 87.2000,
            ShipperName: 'Fun Inc.',
            ShippedDate: '2015-04-01T00:00:00',
            Status: 'A',
        }, {
            ProductName: 'Milk',
            Quantity: 4,
            ExtendedPrice: 9.99999,
            ShipperName: 'ACME',
            ShippedDate: '2015-02-18T00:00:00',
            Status: 'B',
        }, {
            ProductName: 'Canned Beans',
            Quantity: 3,
            ExtendedPrice: 6.85000,
            ShipperName: 'ACME',
            ShippedDate: '2015-03-02T00:00:00',
            Status: 'B',
        }, {
            ProductName: 'Salad',
            Quantity: 2,
            ExtendedPrice: 8.8000,
            ShipperName: 'ACME',
            ShippedDate: '2015-04-12T00:00:00',
            Status: 'C',
        }, {
            ProductName: 'Bread',
            Quantity: 1,
            ExtendedPrice: 2.71212,
            ShipperName: 'Fun Inc.',
            ShippedDate: '2015-01-27T00:00:00',
            Status: 'A',
        }],
    };

    return UIComponent.extend('sap.ui.demo.wt.Component', {
        /* eslint-disable quotes */
        // the SAP parser is literally retarded and **REQUIRES** this line to have double quotes
        metadata: {
            manifest: 'json',
        },
        /* eslint-enable quotes */

        scope: new JSONModel({
            recipient: {
                name: 'World',
            },
        }),
        invoiceModel: new JSONModel(invoice),

        init(...args) {
            // call the init function of the parent
            UIComponent.prototype.init.apply(this, args);

            // set data model
            this.setModel(new ResourceModel({
                bundleName: 'sap.ui.demo.wt.i18n',
            }), 'i18n');

            this.setModel(this.scope);

            this.setModel(this.invoiceModel, 'invoice');

            // set dialog
            this.helloDialog = new HelloDialog();
        },
    });
});
