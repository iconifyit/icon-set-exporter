/**
 * USAGE:
 *
 * 1. Place this script in Applications > Adobe Illustrator > Presets > en_US > Scripts
 * 2. Restart Adobe Illustrator to activate the script
 * 3. The script will be available under menu File > Scripts > Count Objects
 */
/**
 * LICENSE & COPYRIGHT
 *
 *   You are free to use, modify, and distribute this script as you see fit.
 *   No credit is required but would be greatly appreciated.
 *
 *   Scott Lewis - scott@iconify.it
 *   http://github.com/iconifyit
 *   http://iconify.it
 *
 *   THIS SCRIPT IS OFFERED AS-IS WITHOUT ANY WARRANTY OR GUARANTEES OF ANY KIND.
 *   YOU USE THIS SCRIPT COMPLETELY AT YOUR OWN RISK AND UNDER NO CIRCUMSTANCES WILL
 *   THE DEVELOPER AND/OR DISTRIBUTOR OF THIS SCRIPT BE HELD LIABLE FOR DAMAGES OF
 *   ANY KIND INCLUDING LOSS OF DATA OR DAMAGE TO HARDWARE OR SOFTWARE. IF YOU DO
 *   NOT AGREE TO THESE TERMS, DO NOT USE THIS SCRIPT.
 */

/**
 * Declare the target app.
 */
#target illustrator

/**
 * Include the libraries we need.
 */
#includepath "/Users/scott/github/iconify/jsx-common/";


#include "JSON.jsxinc";
#include "Utils.jsxinc";
#include "Logger.jsxinc";

if (!String.prototype.trim) {
    String.prototype.trim = function () {
        return this.replace(/^\s+|\s+$/g, '');
    };
}

/**
 * Name that script.
 */
#script "Set Exporter";

/**
 * Disable Illustrator's alerts.
 */
Utils.displayAlertsOff();

var logger = new Logger("exporter", "~/Downloads/pngs/");

try {
    logger.remove();
    logger.create();
}
catch(e){}

// End global setup

var exportFolder,
    sourceDoc,
    itemsToExport,
    exportDoc,
    svgOptions;

try {
    if ( app.documents.length > 0 ) {

        itemsToExport = [];
        sourceDoc = app.activeDocument;
    }
    else{
        throw new Error('There are no documents open. Open a document and try again.');
    }
}
catch(e) {
    alert(e.message, "Script Alert", true);
}

function doDisplayDialog() {

    var response     = false;
    var dialogWidth  = 450;
    var dialogHeight = 160;
    var dialogLeft   = 550;
    var dialogTop    = 300;

    if ( bounds = Utils.getScreenSize() ) {
        dialogLeft = Math.abs(Math.ceil((bounds.width/2) - (dialogWidth/2)));
    }

    /**
     * Dialog bounds: [ Left, TOP, RIGHT, BOTTOM ]
     * default: //550, 350, 1000, 800
     */

    var dialog = new Window(
        "dialog", "Layer Toggler", [
            dialogLeft,
            dialogTop,
            dialogLeft + dialogWidth,
            dialogTop + dialogHeight
        ]
    );

    try {

        /**
         * Row height
         * @type {number}
         */
        var rh = 30;

        /**
         * Column width
         * @type {number}
         */
        var cw  = 112;

        var c1  = 30;
        var c1w = c1 + 100;

        var c2  = c1 + 190;
        var c2w = c2 + 150;

        var p1 = 16;
        var p2 = dialogWidth - 16;

        var r1 = 40;

        // Sections

        dialog.tokenLabel             = dialog.add('statictext', [c1, 40, c1w, 70], "Search String");
        dialog.token                  = dialog.add('edittext',   [c2, 40, c2w, 70], '001');
        dialog.token.active           = true;

		dialog.resetBtn               = dialog.add('button',  [20,  100, 120, 125], "Reset",  {name: 'reset'});
        dialog.cancelBtn              = dialog.add('button',  [222, 100, 322, 125], "Cancel", {name: 'cancel'});
        dialog.openBtn                = dialog.add('button',  [334, 100, 434, 125], "Start",  {name: 'ok'});

        dialog.cancelBtn.onClick = function() {
            dialog.close();
            response = false;
            return false;
        };

        dialog.resetBtn.onClick = function() {

        	dialog.close();

			var doc    = app.activeDocument;
			var layers = doc.layers;

			try {
				for ( i = 0; i < layers.length; i++ ) {
					layers[i].visible = true;
				}
			}
			catch(e) {
				logger.error(e);
			}

            response = false;
            return false;
        }

        dialog.openBtn.onClick = function() {

			dialog.close();
			response = dialog.token.text;
            return true;
        };

        dialog.show();
    }
    catch(e) {
        logger.error(e);
    }
    return response;
}

var outputFolder = "~/Downloads/pngs/";
var scales       = [1, 2, 4, 8];

var Module = (function(CONFIG) {

    /**
     * Create a new instance of this module.
     * @constructor
     */
    var Instance = function() {

        var doc,
            token,
            artboard,
            artboards,
            theSetFolder,
            theScaleFolder,
            theTargetFile;

        app.coordinateSystem = CoordinateSystem.ARTBOARDCOORDINATESYSTEM;

        if (app.documents.length > 0) {

			doc       = app.activeDocument;
			artboards = doc.artboards;

			if ( response = doDisplayDialog() ) {

			    tokens = response.split(",");

                for (n = 0; n < tokens.length; n++ ) {

                    token = tokens[n].trim();

                    try {

                        if ( ! (new Folder(outputFolder)).exists ) {
                            new Folder(outputFolder).create();
                        }

                        if ( ! (itemsToExport = getExportItemIndexes(token, artboards)) ) {
                            continue;
                        }

                        Utils.showProgressBar( itemsToExport.length * scales.length );

                        for ( i = 0; i < itemsToExport.length; i++ ) {

                            doc.artboards.setActiveArtboardIndex(itemsToExport[i]);

                            artboard = doc.artboards[doc.artboards.getActiveArtboardIndex()]

                            logger.info( outputFolder + token );

                            theSetFolder = new Folder(outputFolder + token);

                            if ( ! theSetFolder.exists ) {
                                theSetFolder.create();
                            }

                            logger.info( artboard.name );

                            for ( x = 0; x < scales.length; x++ ) {

                                theScaleFolder = new Folder( outputFolder + token + "/" + scales[x] + "x" );

                                exportFolder = theScaleFolder;

                                if ( ! theScaleFolder.exists ) {
                                    theScaleFolder.create();
                                }

                                theTargetFile = getTargetFile(token, artboard.name, theScaleFolder);

                                logger.info(theTargetFile);

                                Utils.setProgressMessage(
                                    "Exporting set " + token + ", " + "Icon " + (i + 1) + " @ " + scales[x] * 100 + "%"
                                );

                                if (! theTargetFile.exists) {
                                    exportArtboard(itemsToExport[i], theTargetFile, scales[x] * 100);
                                }
                            }
                        }

                        Utils.hideProgressBar();
                    }
                    catch(e) {
                        logger.error(e);
                        try { exportDoc.close(SaveOptions.DONOTSAVECHANGES); } catch(e){}
                    }
                }

			}

        }
        else  {
            alert(localize({en_US: 'There are no open documents'}))
        }
    }

    /**
     * Returns the public module object.
     */
    return {
        /**
         * Runs the module code.
         */
        run: function() {
            new Instance();
        }
    }

})({
    APP_NAME  : 'ai-count-objects'
});

/**
 * Get array of indices of artboards to export.
 * @param   {string}        token       Set name token
 * @param   {Artboard[]}    artboards   doc.artboards array
 * @returns {*}
 */
function getExportItemIndexes(token, artboards) {
    var itemsToExport = [];
    for ( i = 0; i < artboards.length; i++ ) {
        if ( artboards[i].name.substr(0, token.length) == token ) {
            itemsToExport.push(i);
        }
    }
    if ( ! itemsToExport.length ) return false;
    return itemsToExport;
}

/**
 * Get a reference to the export file.
 * @param   {string}    token           Set name token
 * @param   {string}    artboardName    Name of the artboard to be exported
 * @param   {Folder}    targetFolder    Folder in which to save File
 * @returns {File}
 */
function getTargetFile(token, artboardName, targetFolder) {
    var slug;
    slug = artboardName.replace(token + "-", '');
    slug = slug.replace(/^_/, '');
    return new File(targetFolder.absoluteURI + "/" + slug + ".png");
}

/**
 * Export the active artboard.
 * Selects contents on active artboard, copies, pastes to new document, then exports the new doc.
 * @param artboard
 * @param theTargetFile
 * @param scale
 */
function exportArtboard(idx, theTargetFile, scale) {

    var exportDoc = documents.add(
        DocumentColorSpace.RGB,
        64, 64
    );

    app.activeDocument = sourceDoc;

    var doc = app.activeDocument;

    doc.artboards.setActiveArtboardIndex(idx);
    doc.selectObjectsOnActiveArtboard();

    app.copy();

    app.activeDocument = exportDoc;

    app.executeMenuCommand("pasteFront");

    exportDoc.exportFile( theTargetFile, ExportType.PNG24, getPNGOptions(scale) );

    exportDoc.close(SaveOptions.DONOTSAVECHANGES);
}

function exportLayer(layer, theTargetFile, scale) {

    var item,
        startX,
        startY,
        endX,
        endY,
        name,
        prettyName,
        itemName,
        layerItems;

    layerItems = [];

    for ( var i = 0, len = layer.pageItems.length; i < len; i++ ) {
        layerItems.push(layer.pageItems[i]);
    }
    recurseItems(layer.layers, layerItems);

    if ( !layerItems.length ) {
        return;
    }

    name = layer.name;
    prettyName = name.slice(0, -4).replace(/[^\w\s]|_/g, " ").replace(/\s+/g, "-").toLowerCase();

    for ( i = 0, len = layerItems.length; i < len; i++ ) {
        app.activeDocument = sourceDoc;
        item = layerItems[i];
        item.duplicate( exportDoc, ElementPlacement.PLACEATEND );
    }

    app.activeDocument = exportDoc;

    for ( i = 0, len = exportDoc.pageItems.length; i < len; i++) {

        item = exportDoc.pageItems[i];

        /*
         * For the moment, all pageItems are made visible and exported
         * unless they are locked. This may not make sense, but it'll
         * work for now.
         */
        item.hidden = false;

        if (item.name) {
            itemName = item.name;
            if (itemName.split('.').pop() === 'svg') {
                itemName = itemName.slice(0, -4);
            }
            itemName = itemName.replace(/[^\w\s]|_/g, " ").replace(/\s+/g, "-").toLowerCase()

            item.name = prettyName + '-' + itemName;
        }
        /*
         * We want the smallest startX, startY for obvious reasons.
         * We also want the smallest endX and endY because Illustrator
         * Extendscript treats this coordinate reversed to how the UI
         * treats it (e.g., -142 in the UI is 142).
         *
         */
        startX = ( !startX || startX > item.visibleBounds[0] ) ? item.visibleBounds[0] : startX;
        startY = ( !startY || startY < item.visibleBounds[1] ) ? item.visibleBounds[1] : startY;
        endX = ( !endX || endX < item.visibleBounds[2] ) ? item.visibleBounds[2] : endX;
        endY = ( !endY || endY > item.visibleBounds[3] ) ? item.visibleBounds[3] : endY;
    }

    exportDoc.layers[0].name = name.slice(0, -4);

    // exportDoc.artboards[0].artboardRect = [startX, startY, endX, endY];
    exportDoc.exportFile( theTargetFile, ExportType.PNG24, getPNGOptions(scale) );

    exportDoc.close(SaveOptions.DONOTSAVECHANGES);
}

function exportPNG(doc, name, bounds, exportOptions) {

    // doc.artboards[0].artboardRect = bounds;

    var file = new File( exportFolder.fsName + '/' + name );
    doc.exportFile( file, ExportType.PNG24, exportOptions );
}

function saveFileToPNG(theFilePath, theScale) {

    if (app.documents.length > 0) {

        app.activeDocument.exportFile(
            new File(theFilePath),
            ExportType.PNG24,
            getPNGOptions(theScale)
        );
    }
}

function recurseLayers(layers, layerArray) {

    var layer;

    for ( var i = 0, len = layers.length; i < len; i++ ) {
        layer = layers[i];
        if ( !layer.locked ) {
            layerArray.push(layer);
        }
        if (layer.layers.length > 0) {
            recurseLayers( layer.layers, layerArray );
        }
    }
}

function recurseItems(layers, items) {

    var layer;

    for ( var i = 0, len = layers.length; i < len; i++ ) {
        layer = layers[i];
        if ( layer.pageItems.length > 0 && !layer.locked ) {
            for ( var j = 0, plen = layer.pageItems.length; j < plen; j++ ) {
                if ( !layer.pageItems[j].locked ) {
                    items.push(layer.pageItems[j]);
                }
            }
        }

        if ( layer.layers.length > 0 ) {
            recurseItems( layer.layers, items );
        }
    }
}

function anyParentLocked(item) {
    while ( item.parent ) {
        if ( item.parent.locked ) {
            return true;
        }
        item = item.parent;
    }

    return false;
}


/* Code derived from John Wundes ( john@wundes.com ) www.wundes.com
 * Copyright (c) 2005 wundes.com
 * All rights reserved.
 *
 * This code is derived from software contributed to or originating on wundes.com
 */

function hitTest(a,b){
    if(!hitTestX(a,b)){
        return false;
    }
    if(!hitTestY(a,b)){
        return false;
    }
    return true;
}

function hitTestX(a,b){
    var p1 = a.visibleBounds[0];
    var p2 = b.visibleBounds[0];
    if( (p2<=p1 && p1<=p2+b.width) || (p1<=p2 && p2<=p1+a.width) ) {
        return true;
    }
    return false;
}

function hitTestY(a,b){
    var p3 = a.visibleBounds[1];
    var p4 = b.visibleBounds[1];
    if( (p3>=p4 && p4>=(p3-a.height)) || (p4>=p3 && p3>=(p4-b.height)) ) {
        return true;
    }
    return false;
}

/**
 * getPNGOptions: Function to set the PNG saving options of the
 * files using the PDFSaveOptions object.
 */
function getPNGOptions(theScale) {

    var options = new ExportOptionsPNG24();

    options.antiAliasing     = true;
    options.artBoardClipping = false;
    options.horizontalScale  = theScale;
    options.verticalScale    = theScale;
    options.saveAsHTML       = false;
    options.transparency     = true;

    return options;
}


Module.run();

Utils.displayAlertsOn();
