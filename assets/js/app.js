function PBHelper (options) {

    this.options = options;
    this.sets_base_url = "getproduct.php?productnumber=";
	this.bricks_base_url = "getitemordesign.php?getitemordesign=";
	this.users_base_url = "users.php";
	this.cache_base_url = "cache.php";
	this.defaultImage = "assets/img/defaultimg.png";
	this.defaultSetImage = "assets/img/defaultset.png";
	this.country = "";
	this.LEGOBaseURL = "https://mi-od-live-s.legocdn.com";
	this.AjaxTimeout = 15; //In seconds

	//SETUP 1° : We validate some options params
	if (this.options.LLDUpload_interface == "") {
		console.warn("PBHELPER ERROR", "Non optinal option missing", "LLDUpload_interface");
		return;
	}
	if (this.options.SetSearch_interface == "") {
		console.warn("PBHELPER ERROR", "Non optinal option missing", "SetSearch_interface");
		return;
	}
	if (this.options.BrickSearch_interface == "") {
		console.warn("PBHELPER ERROR", "Non optinal option missing", "BrickSearch_interface");
		return;
	}
	if (this.options.List_interface == "") {
		console.warn("PBHELPER ERROR", "Non optinal option missing", "List_interface");
		return;
	}

	/*
	 * PBHelper and Main functions
	 */

	//This function return the common name of a color (string) from a LEGO defined colorCode
	this.getColorName = function(colorCode) {
		if (LEGO_Color[colorCode] != null) {
			return LEGO_Color[colorCode].Name;
		} else {
			return "";
		}
	}

	//This function return the LEGO Service ID of a color (string) from a LEGO defined colorCode
	this.getColorLegoID = function(colorCode) {
		if (LEGO_Color[colorCode] != null) {
			return LEGO_Color[colorCode].LegoID;
		} else {
			return "";
		}
	}

	//This function finds a color in a list of bricks returned from the site base on a color code
	this.associateColor = function (colorCode, bricks) {

		var reponse = -1;
		var colorID = this.getColorLegoID(colorCode);

		$.each(bricks, function( i, brick ){
			if (brick.ColourDescr.toLowerCase() === colorID.toLowerCase()) {
				reponse = i;
				return false;
			}
		});

		return reponse;
	}

	//This function finds a color in a list of bricks returned from the site base on a color description
	this.associateColourDescr = function (ColourDescr, bricks) {

		var reponse = -1;

		$.each(bricks, function( i, brick ){
			if (ColourDescr != null && brick.ColourDescr != null && brick.ColourDescr.toLowerCase() === ColourDescr.toLowerCase()) {
				reponse = i;
				return false;
			}
		});

		return reponse;
	}

	//This function round the number to a 2 decimal format for price display
	this.roundPrice = function(price) {
		return (Math.round(price * 100) / 100).toFixed(2);
	}

	this.AddElementToTable = function(destination, template, brick) {

		//Some data is required
		if (destination == null) {
			throw new Error("PBHELPER : Non optinal option 'table' missing in tableAddPart function");
		}
		if (template == null) {
			throw new Error("PBHELPER : Non optinal option 'template' missing in tableAddPart function");
		}

		//On s'occupe des infos générales
		$(template).find(".templateTable_row").find(".qte > span").html( brick.qte);
		$(template).find(".templateTable_row").find(".asset").find("img").attr('src', brick.data.getProperty('asset') );
		$(template).find(".templateTable_row").find(".desc").html( brick.data.getProperty('itemDesc') );
		$(template).find(".templateTable_row").find(".color").html( brick.data.getProperty('colorName') );
		$(template).find(".templateTable_row").find(".priceTotal").html( brick.valueStr );

		//Small thing for design ID and Element ID. We don't want to show "empty"
		if (brick.data.getProperty('ID') <= 0) {
			$(template).find(".templateTable_row").find(".elementID").html("");
		} else {
			$(template).find(".templateTable_row").find(".elementID").html( brick.data.getProperty('ID') );
		}

		if (brick.data.getProperty('designid') <= 0) {
			$(template).find(".templateTable_row").find(".desingID").html("");
		} else {
			$(template).find(".templateTable_row").find(".desingID").html( brick.data.getProperty('designid') );
		}

		//We need to do some additonnal stuff before adding the price (Total is already ok)
		//Case n°1 --> LEGO_PartNotAvailable :: Part element found (color found), but not in stock. Price will be "-1"
		if (brick.data.getProperty('price') == -1) {

			var tempErrorIcon = $("#LDDErrorIconTemplate").find(".LEGO_PartNotAvailable").clone();
			$(template).find(".templateTable_row").find(".price").html(tempErrorIcon);

		//Case n°2 --> LEGO_PartColorNotFound :: Part desing ID was found, but no color match. ElementID will be empty
		} else if (brick.data.getProperty('price') == -2) {

			var tempErrorIcon = $("#LDDErrorIconTemplate").find(".LEGO_PartColorNotFound").clone();
			$(template).find(".templateTable_row").find(".price").html(tempErrorIcon);

			//We also aply the "bw-image" class to the image. This is the onlt place we have to do this
			//because all other case we will have the real image or a placehodler.
			//This is because here we will have an image, but not the right one.
			$(template).find(".templateTable_row").find(".asset").find("img").addClass("bw-image");

		//Case n°3 --> LEGO_PartNotFound :: Part description was not found.
		} else if (brick.data.getProperty('price') == -3) {

			var tempErrorIcon = $("#LDDErrorIconTemplate").find(".LEGO_PartNotFound").clone();
			$(template).find(".templateTable_row").find(".price").html(tempErrorIcon);

		//Case n°4 --> Everything is found !
		} else {
			$(template).find(".templateTable_row").find(".price").html( brick.data.getProperty('priceStr') );

		}

		//Copy the line
		var t = $(template).find(".templateTable_row").clone();

		//Change the ID
		$(t).attr('id', "LegoElement-" + brick.data.getProperty('ID') );

		//Add the sort info to the line
		$(t).data('LegoElement', brick.data.getProperty('ID'));

		//Setup the add button. The "List" thingny is responsible for populating the
		//list name in the list selector
		if (brick.data.getProperty('ID') > 0) {
			this.List.setupAddButton($(t).find(".listAdd"));
		} else {
			$(t).find(".listAdd").hide();
		}

		//Keep this safe for the next part
		var _this = this;

		//We add an event to this button
		$(t).find(".listAdd .btn-add").click(function() {

			//Get the lsit ID from the list selector and we have a LegoElement object alreay. So here we go
			_this.List.addElement($(this).parents(".listAdd").data('listid'), brick);
		});

		//Taking care of the action buttons
		$(t).find(".action button.btn-delete").click(function() {
			bootbox.confirm({
				title: "Delete from list?",
				message: "Are you sure you want to delete <strong>"+brick.data.getProperty('itemDesc')+"</strong> in "+brick.data.getProperty('colorName')+" from this list?",
				buttons: {
			        'cancel': {
			            label: 'Cancel',
			            className: 'btn-default pull-left'
			        },
			        'confirm': {
			            label: 'Delete',
			            className: 'btn-danger pull-right'
			        }
			    },
			    callback: function(result) {
					if (result) {
				  		_this.List.deleteElement(brick);
				  	}
				}
			});
		});

		//Setup the qte button
		$(t).find(".action > button.btn-edit").click(function() {
			bootbox.dialog({
			  size: 'small',
			  message:	"<center><form class='form-inline'><div class='form-group-sm'>" +  //!TODO: Bouger dans un fichier .html
			  			"<button class='btn btn-success btn-sm' onclick='qteMinus(this);' ><i class='fa fa-minus'></i></button>&nbsp;" +
			  			"<input type='number' min='1' style='width: 35%;' class='form-control' value='"+brick.qte+"'></input>" +
			  			"&nbsp;<button class='btn btn-success btn-sm' onclick='qtePlus(this);'><i class='fa fa-plus'></i></button>" +
			  			'</div></form></center>',
			  title: "Edit quantity",
			  buttons: {
			    success: {
			      label: "Go",
			      className: "btn-primary",
			      callback: function() {

			        _this.List.editElementQte(brick, $(this).find('input').val());

			      }
			    },
			    main: {
			      label: "Cancel",
			      className: "btn-default pull-left"
			    }
			  }
			});
		});

		//Add the copied line to the template
		$(t).appendTo(destination);

		//Because the temp,late will retain the class if we don't remove it
		$(template).find(".templateTable_row").find(".asset").find("img").removeClass("bw-image");
	}

	//This function is used from the HTML select element
	this.updateCountry = function(element) {

		//Get the selected country code
		var country = $(element).find(":selected").val();

		//Set the country
		this.setCountry(country);
	}

	//This function sets the country and update all the select
	this.setCountry = function(country) {

		//Set the var
		this.country = country;

		//Update all the select on the page
		$('.coutrySelect').removeAttr('selected');
		$('.coutrySelect option[value='+country+']').attr('selected','selected');

		//Set the cookie
		this.cookieHelper.set("PBH_countryCode", country, 24*7);
	}

	this.updateAddButton = function(element) {
		$(element).parents('.listAdd').data('listid', $(element).data('listid'));
		$(element).parents('.listAdd').find('.btn-select > span.txt').html($(element).text());
	}

	//This function send the analitics data to Google Analitycs
	this.SendAnalytics = function (url, pageTitle) {
		if (typeof ga != 'undefined') {
			ga('send', {
				'hitType': 'pageview',
				'page': url,
				'title': pageTitle
			});
		}
	}

	//This function Sort a LegoListElement
	this.SortList = function(rowList, SortBy, Order) {

		//Sort everything
		//Reference for the sort code: http://stackoverflow.com/questions/1069666/sorting-javascript-object-by-property-value
		var rowListSorted = [];
		for (var row in rowList) {

			//Two scenario here:
			//	N°1 : Sort from list property
			//  N°2 : Sort from element property

			//Case n° 1
			if (SortBy == 'qte' || SortBy == 'value') {

				//Send the data to the array which will be sorted
				rowListSorted.push([
			    	rowList[row][SortBy],	//Sortby value
			    	row			//Data
			    ]);

			//Case n° 2
			} else {

				//Send the data to the array which will be sorted
				rowListSorted.push([
			    	rowList[row].data.getProperty(SortBy),	//Sortby value
			    	row							//Data
			    ]);
			}
		}

		//Sort the whole array
		rowListSorted.sort(function(a, b) {return a[0] - b[0]});

		//The sort need an array of two elements, but we want to return
		//an array of keys (Here [element]ID)
		var retour = new Array();
		for (var i = 0; i < rowListSorted.length; ++i) {
			var row = rowListSorted[i];
			retour.push(row[1]); //!TODO HERE
		}

		//If we asked for descending order, we do it here.
		if (Order.toLowerCase() == "desc") {
			retour.reverse();
		}

		//Done
		return retour;
	}

	this.sendLEGODataToCache = function(data) {
		$.post( this.cache_base_url, {'data': JSON.stringify(data)}, 'json');
	}

	this.handleError = function(data, supressDialog) {
		if (data.errorCode != 200) {
			console.warn("Error in PHP Ajax request: " + data.errorDetail + " (Error code " + data.errorCode + ")");

			if (!supressDialog) {
				//Display the error in an alert
				bootbox.alert("An error occured : " + data.errorDetail);
			}
		}
	}

	/*
	 * Setup actions
	 */

	//Initialise les prototypes
	this.LDDUpload();
	this.SetSearch();
	this.BrickSearch();
	this.List();
	this.Navigation();
	this.cookieHelper();

	//Check the cookie to find the country
	if ((PBH_countryCode = this.cookieHelper.get("PBH_countryCode")) != "") {

		//Setup the cookied country code
		this.setCountry(PBH_countryCode);

	} else {

		//Setup default country
		this.setCountry("CA");
	}
}


/*
 //! ------------- LDD Upload -------------
 */
PBHelper.prototype.LDDUpload = function() {

	//Lien vers PBHelper
	this.LDDUpload.parent = this;

	/*
	 * LDDUpload variables
	 */

	this.LDDUpload.Parts = new Object;
	this.LDDUpload.numberElements = 0;
	this.LDDUpload.SortValue = "ID";
	this.LDDUpload.SortOrder = "ASC";

	/*
	 * LDDUpload UI svariables
	 */

	this.LDDUpload.UI = {
		"Main"				: this.options.LLDUpload_interface,
		"LDDPannel" 		: "#LDDUpload_file",
		"PartsTableSource"	: "#LDDtemplateTable",
		"Progress"			: "#analyseLDD_progress"
	};

	/*
	 * LDDUpload main Functions
	 */

	//This function process the data received from the file and call the UI for display
	this.LDDUpload.processLDDData = function(data, fileName) {

		//Reset Data
		this.Parts = new LegoBrickList({
			"fileName": fileName,
			"asset": data.image,
		});

		//This will be used for the progress bar based on the number of elements found by PHP
		this.numberElements = Object.keys(data.bricks).length;

		//Reset the table
		this.UI_resetPartsTable();

		//Disabled the buttons
		this.UI_disableButtons();

		//Show the progress
		this.UI_Progress_init();

		//Variable to keep progress of the current number of part processed
		var currentPart = 0;

		//We are going into .each. We need to make "this" safe
		var _this = this;

		//We add each brick to the table
		$.each(data.bricks, function( DesignId, color_data ){

			//Start with analaytics
			_this.parent.SendAnalytics(_this.parent.bricks_base_url + DesignId + "&country=" + _this.parent.country, "Get item or design");

			$.ajax({

				method: "GET",
				timeout: _this.parent.AjaxTimeout * 1000,
				url: _this.parent.bricks_base_url + DesignId + "&country=" + _this.parent.country,

			}).always(function(data) {

				//We use always because of the timeout because we want to catch cancel and not block
				//the UI. This help checkout error.
				if (data.statusText != null) {

					//Show error to the user
					//Set the text
					//! TODO
					//$(_this.UI.Main).find(_this.UI.Error).find("span.txt").html("Error in AJAX request : Connexion timed out");

					//Copy to the placeholder
					//$(_this.UI.Main).find(_this.UI.Error).clone().attr('id', '').appendTo($(_this.UI.Main).find(_this.UI.SetPlaceholder));

					//Send error to console
					console.warn("Error in AJAX request : Connexion timed out", data);

				} else if (data.Bricks == null) {

					//Set the text
					//$(_this.UI.Main).find(_this.UI.Error).find("span.txt").html("Set " + data.REQUEST + " not found");

					//Copy to the placeholder
					//! TODO
					//$(_this.UI.Main).find(_this.UI.Error).clone().attr('id', '').appendTo($(_this.UI.Main).find(_this.UI.SetPlaceholder));

					//For debug purpose
					console.warn("Element " + data.REQUEST + " not found");

					//Process each brick in result
					$.each(color_data, function( colorCode, NbRequired ){

						//We will add it to the list to show it
						var b = new LegoElement({
							'designid' : parseInt(data.REQUEST),
							'asset': _this.parent.defaultImage,
							'price': -3, //Error code
						});

						//Add some info about this error
						//This list does contain errors...
						_this.Parts.setProperty('listError', true);

						//set the brick color
						b.setColor(colorCode);

						//Add the created brick to the list
						_this.Parts.addBrick(b, NbRequired);
					});

				} else {

					//Send to cache
					_this.parent.sendLEGODataToCache(data);

					//Process each brick in result
					$.each(color_data, function( colorCode, NbRequired ){

						//1° We try to find a color match
						var found_brick = _this.parent.associateColor(colorCode, data.Bricks);

						//Create a brick
						if (found_brick != -1) {
							var b = new LegoElement({
								'ID' : parseInt(data.Bricks[found_brick].ItemNo),
								'designid' : parseInt(data.Bricks[found_brick].DesignId),
								'asset': data.ImageBaseUrl + data.Bricks[found_brick].Asset,
								'assetRaw': data.Bricks[found_brick].Asset,
								'ImageBaseUrl': data.ImageBaseUrl,
								'itemDesc': data.Bricks[found_brick].ItemDescr,
								'price': data.Bricks[found_brick].Price,
								'currency': data.Bricks[found_brick].CId,
								'stock': data.Bricks[found_brick].SQty
							});

							//set the brick color
							b.setColorFromStr(data.Bricks[found_brick].ColourDescr);

							//Add the created brick to the list
							_this.Parts.addBrick(b, NbRequired);

						} else {

							console.warn("Color match not found for color code '" + colorCode + "' and designID '"+ DesignId +"'");

							var b = new LegoElement({
								'designid' : parseInt(data.Bricks[0].DesignId),
								'asset': data.ImageBaseUrl + data.Bricks[0].Asset,
								'itemDesc': data.Bricks[0].ItemDescr,
								'price': -2,
							});

							//Add some info about this error
							//This list does contain errors...
							_this.Parts.setProperty('listError', true);

							//set the brick color
							b.setColor(colorCode);

							//Add the created brick to the list
							_this.Parts.addBrick(b, NbRequired);
						}
					});
				}

				//We update the progress
			    currentPart++;
			    _this.UI_Progress_update(currentPart);

				//Check if we are done
			    if (currentPart >= _this.numberElements) {

				    //Set the UI
					_this.UI_setLDDPannel();

					//Stop the progress
				    _this.UI_Progress_done();

				    //Display the list
				    _this.displayLists();

					//To set the buttons, we reable them and disabled again with the switch
					_this.UI_resetButtons();
				}

			});
		});
	}

	//This function take care of displaying lists elements
	this.LDDUpload.displayLists = function() {

		//Vide la liste existante
		this.UI_resetPartsTable();

		//Sort the list
		//Be careful here: sorted list will ONLY return an array of elementID (keys) based on the order the list needs to be displayed.
		//We don't send the whole object sorted because apparently that CAN'T be done.
		var sortedList = this.parent.SortList(this.Parts.getBricks(), this.SortValue, this.SortOrder);

		//All every bricks
		for (var i in sortedList) {
			this.parent.AddElementToTable(
				$(this.UI.Main).find(this.UI.LDDPannel + " > table > tbody"),	// Destination
				$(this.UI.Main).find(this.UI.PartsTableSource), 				// Source
				this.Parts.getBrick(sortedList[i])								// Brick
			);
		}

		//We set the value in the template
		$(this.UI.Main).find(this.UI.PartsTableSource).find(".templateTable_Totalrow").find(".txtTotal").html( this.Parts.getValue(true) );

		//We copy it to the pannel
		$(this.UI.Main).find(this.UI.PartsTableSource).find(".templateTable_Totalrow").clone().appendTo($(this.UI.Main).find(this.UI.LDDPannel + " > table > tfoot"));

		//Setup the setupWholeListAddButton
		this.parent.List.setupWholeListAddButton($(this.UI.Main).find(this.UI.LDDPannel), "App.LDDUpload.Save");

		//We show the table
		this.UI_showPartsTable();
	}

	//This function is used to save all the part found for a search query to an NEW list with a user specified name
	this.LDDUpload.SavetoCreateList = function(element, confirm) {

		//Keep this safe
		var _this = this;

		//If the list does contain error, we show a small warning
		if (this.Parts.getProperty('listError') && !confirm) {

			bootbox.alert('<i class="fa fa-exclamation-triangle"></i> Take note: Brick without an element ID will be ignored.', function() {
				_this.SavetoCreateList(element, true);
			});

		} else {

			bootbox.prompt("Please enter your new list name", function(result) {
				if (result != null && result != "") {

					//spinner it !
					$("#SavingModalSpinner").modal('show');

					//Save while creating a new list using the specified name
					_this.parent.List.Save_createNewList(result, _this.Parts.getProperty("asset"), _this.Parts);
				}
			});
		}
	}

	//This function is used to save all the part found for a search query to an NEW list using the search result name
	this.LDDUpload.SavetoNewList = function(element, confirm) {

		//spinner it !
		$("#SavingModalSpinner").modal('show');

		//Keep this safe
		var _this = this;

		//If the list does contain error, we show a small warning
		if (this.Parts.getProperty('listError') && !confirm) {

			bootbox.alert('<i class="fa fa-exclamation-triangle"></i> Take note: Brick without an element ID will be ignored.', function() {
				_this.SavetoNewList(element, true);
			});

		} else {

			//Save while creating a new list using the Product Name name
			this.parent.List.Save_createNewList(this.Parts.getProperty("fileName"), this.Parts.getProperty("asset"), _this.Parts);
		}
	}

	//This function is used to save all the part found for a search query to an existing list
	this.LDDUpload.Save = function(element, confirm) {

		//Keep this safe
		var _this = this;

		//If the list does contain error, we show a small warning
		if (this.Parts.getProperty('listError') && !confirm) {

			bootbox.alert('<i class="fa fa-exclamation-triangle"></i> Take note: Brick without an element ID will be ignored.', function() {
				_this.Save(element, true);
			});

		} else {

			//spinner it !
			$("#SavingModalSpinner").modal('show');

			//Add all the bricks to the selected listID
			this.parent.List.addElements($(element).data("listid"), _this.Parts, function() {

				//Hide the spinner
				$("#SavingModalSpinner").modal('hide');

				//Reload the main lists
				_this.parent.List.setupMainList();

				//Go to lists
				_this.parent.Navigation.Go(".nav-app-list");

				//And show the list of lists
				_this.parent.List.UI_ShowLists();
			});
		}
	}

	//This function is called by the UI to change the order of the list.
	//It only change the global param and refresh the list. The refresh function take care of the actual sorting
	this.LDDUpload.SortTable = function(SortBy, Order) {

		//Save the order
		this.SortValue = SortBy;
		this.SortOrder = Order;

		//Refresh the list
		this.displayLists();
	}

	/*
	 * UI Functions
	 */

	//This function setup the file info pannel and show it.
	this.LDDUpload.UI_setLDDPannel = function() {
		$(this.UI.Main).find(this.UI.LDDPannel).find(".panel-heading").html( this.Parts.getProperty('fileName') );
		$(this.UI.Main).find(this.UI.LDDPannel).find(".nbPieces > span").html( this.Parts.getNbBricks() );
		$(this.UI.Main).find(this.UI.LDDPannel).find(".nbElements > span").html( this.Parts.getNbElements() );
		$(this.UI.Main).find(this.UI.LDDPannel).find("img").attr('src', this.Parts.getProperty('asset') );
		$(this.UI.Main).find(this.UI.LDDPannel).show();
	}

	//This function reset the file info pannel and hide it.
	this.LDDUpload.UI_resetLDDPannel = function() {
		$(this.UI.Main).find(this.UI.LDDPannel).find(".panel-heading").html("");
		$(this.UI.Main).find(this.UI.LDDPannel).find(".nbPieces > span").html(0);
		$(this.UI.Main).find(this.UI.LDDPannel).find(".nbElements > span").html(0);
		$(this.UI.Main).find(this.UI.LDDPannel).find("img").attr('src', this.parent.defaultSetImage);
		$(this.UI.Main).find(this.UI.LDDPannel).hide();

		//Also reset the buttons
		this.UI_resetButtons();

		//Reset the table
		this.UI_resetPartsTable();
	}

	//This function reset the parts table
	this.LDDUpload.UI_showPartsTable = function() {

		//Show the table
		$(this.UI.Main).find(this.UI.LDDPannel + " > table").show();

		//We must also reset the Bootstrap Tooltips added with Javascript
		$('[data-toggle="tooltip"]').tooltip();
	}

	//This function reset the parts table
	this.LDDUpload.UI_resetPartsTable = function() {
		$(this.UI.Main).find(this.UI.LDDPannel + " > table").find("tr:gt(0)").remove(); //Remove all lines
		$(this.UI.Main).find(this.UI.LDDPannel + " > table").hide(); //Hide the table
	}

	//This function disabled all button. Option can omit the destroy one
	this.LDDUpload.UI_disableButtons = function(omitDestroy) {
		$(this.UI.Main).find(this.UI.LDDPannel).find(".btn").attr('disabled', 'disabled');
	}

	//This function reset the buttons state
	this.LDDUpload.UI_resetButtons = function() {
		$(this.UI.Main).find(this.UI.LDDPannel).find(".btn").removeAttr('disabled');
	}

	//This function set the analyser progress bar
	this.LDDUpload.UI_Progress_init = function() {
		$(this.UI.Main).find(this.UI.Progress).show();
		$(this.UI.Main).find(this.UI.Progress).find("span.current").html("0");
		$(this.UI.Main).find(this.UI.Progress).find("span.totalnb").html(this.numberElements);
		$(this.UI.Main).find(this.UI.Progress).find("div.progress-bar").css("width", "0%");
	}

	//This function update the analyser progress bar.
	this.LDDUpload.UI_Progress_update = function(current) {
		$(this.UI.Main).find(this.UI.Progress).find("span.current").html(current);
		$(this.UI.Main).find(this.UI.Progress).find("div.progress-bar").css("width", (current/this.numberElements*100)+"%");
	}

	//This function hide the analyser progress bar.
	this.LDDUpload.UI_Progress_done = function() {
		$(this.UI.Main).find(this.UI.Progress).hide();
	}
}

/*
 //! ------------- SET SEARCH -------------
 */
PBHelper.prototype.SetSearch = function() {

	//Keep a link to PBHelper
	this.SetSearch.parent = this;

	/*
	 * SetSearch variables
	 */

	var totalSearch = 0; //Number of sets to search for
	this.fetchData = new Object;
	//this.SetSearch.SortValue = "ID";
	//this.SetSearch.SortOrder = "ASC";

	/*
	 * SetSearch UI variables
	 */

	this.SetSearch.UI = {
		"Main"			: this.options.SetSearch_interface,
		"Form"			: "#setForm",
		"FormInput"		: "#setFormValue",
		"SetPlaceholder"	: "#setsPlaceholder",
		"SetPannel" 		: "#setsPannelTemplate",
		"PartsTableSource"	: "#setTemplateTable",
		"Progress"			: "#setProgress",
		"Error"				: "#setNotFound"
	};

	/*
	 * LDDUpload main Functions
	 */

	this.SetSearch.Search = function() {

		//Reset the UI
		this.UI_reset();

		//Disable the search buttons
		this.UI_disableButtons();

		//Get the form data
		var itemordesignnumber = $(this.UI.Main).find(this.UI.Form).find(this.UI.FormInput).val();
		var items = itemordesignnumber.split(",");

		//Set the infos for the progress
		var currentPart = 0;
		this.totalSearch = items.length;
		this.UI_Progress_init();

		//Reset fetch data
		this.fetchData = new Object;

		//We are going into .each. We need to make "this" safe
		var _this = this;

		//For each item in the form list
		$.each(items, function( index, item ){

			//We trim to get rid of spaces used in the comma separated list
			item = item.trim();

			//Start with analaytics
			_this.parent.SendAnalytics(_this.parent.sets_base_url + item + "&country=" + _this.parent.country, "Get set");

			$.ajax({

				method: "GET",
				timeout: _this.parent.AjaxTimeout * 1000,
				url: _this.parent.sets_base_url + item + "&country=" + _this.parent.country,

			}).always(function(data) {

				//We use always because of the timeout because we want to catch cancel and not block
				//the UI. This help checkout error.
				if (data.statusText != null) {

					//Show error to the user
					//Set the text
					$(_this.UI.Main).find(_this.UI.Error).find("span.txt").html("Error in AJAX request : Connexion timed out");

					//Copy to the placeholder
					$(_this.UI.Main).find(_this.UI.Error).clone().attr('id', '').appendTo($(_this.UI.Main).find(_this.UI.SetPlaceholder));

					//Send error to console
					console.warn("Error in AJAX request : Connexion timed out", data);

				} else if (data.Bricks == null) {

					//Set the text
					$(_this.UI.Main).find(_this.UI.Error).find("span.txt").html("Set " + data.REQUEST + " not found");

					//Copy to the placeholder
					$(_this.UI.Main).find(_this.UI.Error).clone().attr('id', '').appendTo($(_this.UI.Main).find(_this.UI.SetPlaceholder));

					//For debug purpose
					console.warn("Set " + data.REQUEST + " not found");

				} else {

					//Send to cache
					_this.parent.sendLEGODataToCache(data);

					//Create a list element
					_this.fetchData[data.REQUEST] = new LegoBrickList({
						"query" : data.REQUEST,
						"ProductName": data.Product.ProductName,
						"ProductAsset": data.ImageBaseUrl + data.Product.Asset,
						"ProductNo": data.Product.ProductNo,
						"SortOrder": "ASC",
						"SortValue": "ID"
					});

					//Process each brick in result
					$.each(data.Bricks, function( index, brick ){

						//Create a brick
						var b = new LegoElement({
							'ID' : parseInt(brick.ItemNo),
							'designid' : parseInt(brick.DesignId),
							'asset': data.ImageBaseUrl + brick.Asset,
							'assetRaw': brick.Asset,
							'ImageBaseUrl': data.ImageBaseUrl,
							'itemDesc': brick.ItemDescr,
							'price': brick.Price,
							'currency': brick.CId,
							'stock': brick.SQty
						});

						//set the brick color
						b.setColorFromStr(brick.ColourDescr);

						//Add the created brick to the list
						_this.fetchData[data.REQUEST].addBrick(b);
					});
				}

				//We update the progress
			    currentPart++;
			    _this.UI_Progress_update(currentPart);

				//Check if we are done
			    if (currentPart >= _this.totalSearch) {

				    //Display all the lists in "fetchData"
					_this.displayLists();

				    //Stop the progress
				    _this.UI_Progress_done();

					//Reset the button
					_this.UI_resetButtons();

					//We must also reset the Bootstrap Tooltips added with Javascript
					$('[data-toggle="tooltip"]').tooltip();
				}
			});
		});
	}

	//This function reset the UI and take cares of function once everything is done
	this.SetSearch.displayLists = function() {

		//Reset the UI
		this.UI_reset();

		//For each list
		for (var i in this.fetchData) {

			//We create a the pannel
			var createdPannelID = this.UI_createPannel(i);

			//Sort the list
			//Be careful here: sorted list will ONLY return an array of elementID (keys) based on the order the list needs to be displayed.
			//We don't send the whole object sorted because apparently that CAN'T be done.
			var sortedList = this.parent.SortList(this.fetchData[i].getBricks(), this.fetchData[i].getProperty("SortValue"), this.fetchData[i].getProperty("SortOrder"));

			//All every bricks
			for (var j in sortedList) {
				this.parent.AddElementToTable(
					$(this.UI.Main).find(createdPannelID + " > table > tbody"),	// Destination
					$(this.UI.Main).find(this.UI.PartsTableSource), 			// Source
					this.fetchData[i].getBrick(sortedList[j])					// Brick
				);
			}
		}

		//We can show the holder
		$(this.UI.Main).find(this.UI.SetPlaceholder).show();
	}

	//This function is called by the UI to change the order of the list.
	//It only change the global param and refresh the list. The refresh function take care of the actual sorting
	this.SetSearch.SortTable = function(SortBy, Order, element) {

		//Save the order
		this.fetchData[$(element).parents('.panel').data('list')].setProperty("SortValue", SortBy);
		this.fetchData[$(element).parents('.panel').data('list')].setProperty("SortOrder", Order);

		//Refresh the list
		this.displayLists();
	}

	//This function is used to save all the part found for a search query to an NEW list with a user specified name
	this.SetSearch.SavetoCreateList = function(element) {

		//Keep this safe
		var _this = this;

		bootbox.prompt("Please enter your new list name", function(result) {
			if (result != null && result != "") {

				//spinner it !
				$("#SavingModalSpinner").modal('show');

				//Small shortcut so it's easier later
				var listData = _this.fetchData[$(element).parents('.panel').data('list')];

				//Save while creating a new list using the specified name
				_this.parent.List.Save_createNewList(result, listData.getProperty("ProductAsset"), listData);
			}
		});
	}

	//This function is used to save all the part found for a search query to an NEW list using the search result name
	this.SetSearch.SavetoNewList = function(element) {

		//spinner it !
		$("#SavingModalSpinner").modal('show');

		//Small shortcut so it's easier later
		var listData = this.fetchData[$(element).parents('.panel').data('list')];

		//Save while creating a new list using the Product Name name
		this.parent.List.Save_createNewList(listData.getProperty("ProductName"), listData.getProperty("ProductAsset"), listData);
	}

	//This function is used to save all the part found for a search query to an existing list
	this.SetSearch.Save = function(element) {

		//spinner it !
		$("#SavingModalSpinner").modal('show');

		//Keep this safe
		var _this = this;

		//Add all the bricks to the selected listID
		this.parent.List.addElements($(element).data("listid"), this.fetchData[$(element).parents('.panel').data('list')], function() {

			//Hide the spinner
			$("#SavingModalSpinner").modal('hide');

			//Reload the main lists
			_this.parent.List.setupMainList();

			//Go to lists
			_this.parent.Navigation.Go(".nav-app-list");

			//And show the list of lists
			_this.parent.List.UI_ShowLists();
		});
	}

	/*
	 * UI Functions
	 */

	//This function reset the UI (flush the result div)
	this.SetSearch.UI_reset = function() {
		//We empty the result holder
		$(this.UI.Main).find(this.UI.SetPlaceholder).html("");

		//...and we hide it
		$(this.UI.Main).find(this.UI.SetPlaceholder).hide();
	}

	//This function create a div containing the set infos and part table
	this.SetSearch.UI_createPannel = function(i) {

		//We copy the pannel
		var t = $(this.UI.Main).find(this.UI.SetPannel).clone().attr('id', 'SetPannel_' + this.fetchData[i].getProperty('ProductNo'));

		//Set the pannel details
		$(t).find(".panel-heading").html(this.fetchData[i].getProperty('ProductName'));
		$(t).find(".setImg").attr('src', this.fetchData[i].getProperty('ProductAsset'));
		$(t).find(".setNumber").html(this.fetchData[i].getProperty('ProductNo'));
		$(t).find(".setNbPieces").html(this.fetchData[i].getNbElements());

		//For the save list
		$(t).data('list', i);

		//Setup the setupWholeListAddButton
		this.parent.List.setupWholeListAddButton(t, "App.SetSearch.Save");

		//Append to the source
		$(t).appendTo($(this.UI.Main).find(this.UI.SetPlaceholder));

		//Reset the template
		this.UI_resetTemplatePannel();

		//We return the newly created if location
		return '#SetPannel_' + this.fetchData[i].getProperty('ProductNo');
	}

	//This function reset the template pannel
	this.SetSearch.UI_resetTemplatePannel = function() {

		$(this.UI.Main).find(this.UI.SetPannel).find(".panel-heading").html("");
		$(this.UI.Main).find(this.UI.SetPannel).find(".setNbPieces").html(0);
		$(this.UI.Main).find(this.UI.SetPannel).find(".setNbUniqueElements").html(0);
		$(this.UI.Main).find(this.UI.SetPannel).find("img").attr('src', this.parent.defaultSetImage);
	}

	//This function disabled all button.
	this.SetSearch.UI_disableButtons = function() {
		$(this.UI.Main).find(this.UI.Form).find(".btn").attr('disabled', 'disabled');
	}

	//This function re-enable the buttons state
	this.SetSearch.UI_resetButtons = function() {
		$(this.UI.Main).find(this.UI.Form).find(".btn").removeAttr('disabled');
	}

	//This function set the analyser progress bar
	this.SetSearch.UI_Progress_init = function() {
		$(this.UI.Main).find(this.UI.Progress).show();
		$(this.UI.Main).find(this.UI.Progress).find("span.current").html(1);
		$(this.UI.Main).find(this.UI.Progress).find("span.totalnb").html(this.totalSearch);
	}

	//This function update the analyser progress bar.
	this.SetSearch.UI_Progress_update = function(current) {
		$(this.UI.Main).find(this.UI.Progress).find("span.current").html(current+1);
	}

	//This function hide the analyser progress bar.
	this.SetSearch.UI_Progress_done = function() {
		$(this.UI.Main).find(this.UI.Progress).hide();
	}
}

/*
 //! ------------ BRICK SEARCH ------------
 */

PBHelper.prototype.BrickSearch = function() {

	//Keep a link to PBHelper
	this.BrickSearch.parent = this;

	/*
	 * BrickSearch variables
	 */

	 var totalSearch = 0; //Number of bricks to search for
	 this.fetchData = new Object;
	 this.BrickSearch.SortValue = "ID";
	 this.BrickSearch.SortOrder = "ASC";

	/*
	 * BrickSearch UI variables
	 */

	this.BrickSearch.UI = {
		"Main"			: this.options.BrickSearch_interface,
		"Form"			: "#brickForm",
		"FormInput"		: "#brickFormValue",
		"Placeholder"	: "#bricksPlaceholder",
		"Pannel" 		: "#bricksPannelTemplate",
		"PartsTableSource"	: "#brickTemplateTable",
		"Progress"			: "#brickProgress",
		"Error"				: "#bricksNotFound",
		"ErrorPlaceholder"	: "#errorPlaceholder",
	};

	/*
	 * BrickSearch main Functions
	 */

	this.BrickSearch.Search = function() {

		//Reset the UI
		this.UI_reset();

		//Disable the search buttons
		this.UI_disableButtons();

		$(this.UI.ErrorPlaceholder).html("");

		//Get the form data
		var itemordesignnumber = $(this.UI.Main).find(this.UI.Form).find(this.UI.FormInput).val();
		var items = itemordesignnumber.split(",");

		//Set the infos for the progress
		var currentPart = 0;
		this.totalSearch = items.length;
		this.UI_Progress_init();

		//Reset fetch data
		this.fetchData = new Object;

		//We are going into .each. We need to make "this" safe
		var _this = this;

		//For each item in the form list
		$.each(items, function( index, item ){

			//We trim to get rid of spaces used in the comma separated list
			item = item.trim();

			//Start with analaytics
			_this.parent.SendAnalytics(_this.parent.bricks_base_url + item + "&country=" + _this.parent.country, "Get item or design");

			$.ajax({

				method: "GET",
				timeout: _this.parent.AjaxTimeout * 1000,
				url: _this.parent.bricks_base_url + item + "&country=" + _this.parent.country,

			}).always(function(data) {

				//We use always because of the timeout because we want to catch cancel and not block
				//the UI. This help checkout error.
				if (data.statusText != null) {

					//Show error to the user
					//Set the text
					$(_this.UI.Main).find(_this.UI.Error).find("span.txt").html("Error in AJAX request : Connexion timed out");

					//Copy to the placeholder
					$(_this.UI.Main).find(_this.UI.Error).clone().attr('id', '').appendTo($(_this.UI.Main).find(_this.UI.Placeholder));

					//Send error to console
					console.warn("Error in AJAX request : Connexion timed out", data);

				} else if (data.Bricks == null) {

					//Set the text
					$(_this.UI.Main).find(_this.UI.Error).find("span.txt").html("Element " + data.REQUEST + " not found");

					//Copy to the placeholder
					$(_this.UI.Main).find(_this.UI.Error).clone().attr('id', '').appendTo($(_this.UI.Main).find(_this.UI.ErrorPlaceholder));

					//For debug purpose
					console.warn("Element " + data.REQUEST + " not found");

				} else {

					//Send to cache
					_this.parent.sendLEGODataToCache(data);

					//Create a list element
					_this.fetchData[data.REQUEST] = new LegoBrickList({
						"query" : data.REQUEST,
						"SortOrder": "ASC",
						"SortValue": "ID"
					});

					//Process each brick in result
					$.each(data.Bricks, function( index, brick ){

						//Create a brick
						var b = new LegoElement({
							'ID' : parseInt(brick.ItemNo),
							'designid' : parseInt(brick.DesignId),
							'asset': data.ImageBaseUrl + brick.Asset,
							'assetRaw': brick.Asset,
							'ImageBaseUrl': data.ImageBaseUrl,
							'itemDesc': brick.ItemDescr,
							'price': brick.Price,
							'currency': brick.CId,
							'stock': brick.SQty
						});

						//set the brick color
						b.setColorFromStr(brick.ColourDescr);

						//Add the created brick to the list
						_this.fetchData[data.REQUEST].addBrick(b);
					});
				}

				//We update the progress
			    currentPart++;
			    _this.UI_Progress_update(currentPart);

				//Check if we are done
			    if (currentPart >= _this.totalSearch) {

				  	//Display all the lists in "fetchData"
					_this.displayLists();

					//Stop the progress
					_this.UI_Progress_done();

					//Reset the button
					_this.UI_resetButtons();

					//We must also reset the Bootstrap Tooltips added with Javascript
					$('[data-toggle="tooltip"]').tooltip();
				}
			});
		});
	}

	//This function take care of displaying lists elements
	this.BrickSearch.displayLists = function() {

		//Reset the UI
		this.UI_reset();

		//For each list
		for (var i in this.fetchData) {

			//We create a the pannel
			var createdPannelID = this.UI_createPannel( this.fetchData[i].getProperty('query') );

			//Sort the list
			//Be careful here: sorted list will ONLY return an array of elementID (keys) based on the order the list needs to be displayed.
			//We don't send the whole object sorted because apparently that CAN'T be done.
			var sortedList = this.parent.SortList(this.fetchData[i].getBricks(), this.fetchData[i].getProperty("SortValue"), this.fetchData[i].getProperty("SortOrder"));

			//All every bricks
			for (var j in sortedList) {
				this.parent.AddElementToTable(
					$(this.UI.Main).find(createdPannelID + " > table > tbody"),	// Destination
					$(this.UI.Main).find(this.UI.PartsTableSource), 			// Source
					this.fetchData[i].getBrick(sortedList[j])					// Brick
				);
			}
		}

		//We can show the holder
		$(this.UI.Main).find(this.UI.Placeholder).show();
	}

	//This function is called by the UI to change the order of the list.
	//It only change the global param and refresh the list. The refresh function take care of the actual sorting
	this.BrickSearch.SortTable = function(SortBy, Order, element) {

		//Save the order
		this.fetchData[$(element).parents('.panel').data('list')].setProperty("SortValue", SortBy);
		this.fetchData[$(element).parents('.panel').data('list')].setProperty("SortOrder", Order);

		//Refresh the list
		this.displayLists();
	}

	/*
	 * UI Functions
	 */

	//This function reset the UI (flush the result div)
	this.BrickSearch.UI_reset = function() {
		//We empty the result holder
		$(this.UI.Main).find(this.UI.Placeholder).html("");

		//...and we hide it
		$(this.UI.Main).find(this.UI.Placeholder).hide();
	}

	//This function create a div containing the set infos and part table
	this.BrickSearch.UI_createPannel = function(SearchQuery) {

		//We copy the pannel
		var t = $(this.UI.Main).find(this.UI.Pannel).clone().attr('id', 'Pannel_' + SearchQuery);

		//Set the pannel details
		$(t).find(".panel-heading > span").html(SearchQuery);

		//For the save list
		$(t).data('list', SearchQuery);

		//Append to the source
		$(t).appendTo($(this.UI.Main).find(this.UI.Placeholder));

		//Reset the template
		this.UI_resetTemplatePannel();

		//We return the newly created if location
		return '#Pannel_' + SearchQuery;
	}

	//This function reset the template pannel
	this.BrickSearch.UI_resetTemplatePannel = function() {
		$(this.UI.Main).find(this.UI.Pannel).find(".panel-heading > span").html("");
	}

	//This function disabled all button.
	this.BrickSearch.UI_disableButtons = function() {
		$(this.UI.Main).find(this.UI.Form).find(".btn").attr('disabled', 'disabled');
	}

	//This function re-enable the buttons state
	this.BrickSearch.UI_resetButtons = function() {
		$(this.UI.Main).find(this.UI.Form).find(".btn").removeAttr('disabled');
	}

	//This function set the analyser progress bar
	this.BrickSearch.UI_Progress_init = function() {
		$(this.UI.Main).find(this.UI.Progress).show();
		$(this.UI.Main).find(this.UI.Progress).find("span.current").html(1);
		$(this.UI.Main).find(this.UI.Progress).find("span.totalnb").html(this.totalSearch);
	}

	//This function update the analyser progress bar.
	this.BrickSearch.UI_Progress_update = function(current) {
		$(this.UI.Main).find(this.UI.Progress).find("span.current").html(current+1);
	}

	//This function hide the analyser progress bar.
	this.BrickSearch.UI_Progress_done = function() {
		$(this.UI.Main).find(this.UI.Progress).hide();
	}

	//This function force search the brick ID specified in argument
	this.BrickSearch.SearchBrick = function(brickid) {

		//Update the form
		$(this.UI.Main).find(this.UI.FormInput).val(brickid);

		//Send the search
		this.Search();

		//Show the page in navigation
		this.parent.Navigation.Go(this.UI.Main);
	}

	//This function is used to seach a brick, used in a link
	this.BrickSearch.SearchBrickLink = function(element) {

		//Get the tag id
		var brickID = $(element).text();

		//Make sure the ID is not empty
		if (brickID != "") {
			this.SearchBrick(brickID);
		}
	}
}

/*
 //! ----------------- LIST -----------------
 */

PBHelper.prototype.List = function() {

	//Keep a link to PBHelper
	this.List.parent = this;

	/*
	 * List variables
	 */

	 this.List.lists = new Object();
	 this.List.active = 0;
	 this.List.SortValue = "ID";
	 this.List.SortOrder = "ASC";

	/*
	 * List UI variables
	 */

	this.List.UI = {
		"Main"			: this.options.List_interface,
		"Spinner"		: ".progressDiv",
		"Login"			: ".loginPanel",
		"Register"		: ".registerPanel",
		"Mainlist"		: ".mainlist",
		"listCreateForm": ".listCreateForm",
		"Templates"		: "#list_template",
		"Lists"			: ".listsPlaceholder",
		"ListDetail" 	: ".listContentPlaceholder",
		"PartsTableSource"	: "#LDDtemplateTable",
		"Progress"			: "#analyseList_progress",
		"listPrevious"		: ".listPrevious"
	};

	/*
	 * Main Functions
	 */

	//This function takes care of the login precedure
	this.List.Login = function(formElement) {

		//Reset the error
		$(this.UI.Main).find(this.UI.Login).find(".alert-danger").hide();
		$(this.UI.Main).find(this.UI.Login).find(".alert-danger > span").html("");

		//Disable button
		$(this.UI.Main).find(this.UI.Login).find(".btn").attr('disabled', 'disabled');

		//Get all the data
		var email = $(formElement).find('[name="email"]').val();
		var pass = $(formElement).find('[name="password"]').val();

		//Check if all field have something in it
		if (email.length == 0 || pass.length == 0) {
			$(this.UI.Main).find(this.UI.Login).find(".alert-danger").show();
			$(this.UI.Main).find(this.UI.Login).find(".alert-danger > span").html("Please fill in all the fields");
			$(this.UI.Main).find(this.UI.Login).find(".btn").removeAttr('disabled');
			return;
		}

		//We keep this secured
		var _this = this;

		//We send to PHP
		$.post( this.parent.users_base_url + "?action=login", {
			'email': email,
			'pass': pass,
		}, function( data ) {

			//This will ned need to be replace somehere else...
			_this.parent.handleError(data);

			//Enabled buttons
			$(_this.UI.Main).find(_this.UI.Login).find(".btn").removeAttr('disabled');

			//Process data
			if (!data.success) {
				$(_this.UI.Main).find(_this.UI.Login).find(".alert-danger").show();
				$(_this.UI.Main).find(_this.UI.Login).find(".alert-danger > span").html("Email & password combinasion doesn't match");
				return;
			} else {
				_this.LoadUsers();
			}
		}, 'json');
	}

	//This function takes care of the registration procedure
	this.List.Register = function(formElement) {

		//Reset the error
		$(this.UI.Main).find(this.UI.Register).find(".alert-danger").hide();
		$(this.UI.Main).find(this.UI.Register).find(".alert-danger > span").html("");

		//Disable button
		$(this.UI.Main).find(this.UI.Register).find(".btn").attr('disabled', 'disabled');

		//Get all the data
		var name = $(formElement).find('[name="name"]').val();
		var email = $(formElement).find('[name="email"]').val();
		var pass1 = $(formElement).find('[name="password1"]').val();
		var pass2 = $(formElement).find('[name="password2"]').val();

		//Check if all field have something in it
		if (name.length == 0 || email.length == 0 || pass1.length == 0 || pass2.length == 0) {
		 $(this.UI.Main).find(this.UI.Register).find(".alert-danger").show();
		 $(this.UI.Main).find(this.UI.Register).find(".alert-danger > span").html("Please fill in all the fields");
		 $(this.UI.Main).find(this.UI.Register).find(".btn").removeAttr('disabled');
		 return;
		}

		//Check if the two password are the same
		if (pass1 != pass2) {
		 $(this.UI.Main).find(this.UI.Register).find(".alert-danger").show();
		 $(this.UI.Main).find(this.UI.Register).find(".alert-danger > span").html("The two password are not the same");
		 $(this.UI.Main).find(this.UI.Register).find(".btn").removeAttr('disabled');
		 return;
		}

		//We keep this secured
		var _this = this;

		//We send to PHP
		$.post( this.parent.users_base_url + "?action=register", {
			'name': name,
			'email': email,
			'pass1': pass1,
			'pass2': pass2
		}, function( data ) {

			//This will ned need to be replace somehere else...
			_this.parent.handleError(data);

			//Enabled buttons
			$(_this.UI.Main).find(_this.UI.Register).find(".btn").removeAttr('disabled');

			//Process data
			if (!data.success) {
				$(_this.UI.Main).find(_this.UI.Register).find(".alert-danger").show();
				$(_this.UI.Main).find(_this.UI.Register).find(".alert-danger > span").html("This email is already registered");
				return;
			} else {
				_this.UI_ShowLogin("Account registered successfully! You can now login.");
			}
		}, 'json');
	 }

	//This function takes care of loading the user info and his lists from PHP
	this.List.LoadUsers = function() {

		//Show the spinner
		this.UI_ShowSpinner();

		//Reset some vars
		this.lists = new Object();
		this.active = 0;

		//We keep this secured
		var _this = this;

		//We get user data
		$.post( this.parent.users_base_url + "?action=List", function( reponse ) {

			//This will ned need to be replace somehere else...
			_this.parent.handleError(reponse, true);

			//Process reponse
			if (reponse.success) {

				//Parse the PHP Data. This will send th lists to the cache in 'this'
				_this.parsePhpData(reponse.data.userlists);

				//Display the username
				//Setup the pannel header
				$(_this.UI.Main).find(_this.UI.Mainlist).find("h3 span").html(reponse.data.userdata.username);

				//Setup the main list of lists. The lists are already in 'this'
				_this.setupMainList();

			} else if (!reponse.success && reponse.errorCode == 406) {

				_this.UI_ShowLogin();

			} else {
				//!TODO: Bootbox
				console.log("ERROR", reponse);

			}
		}, 'json');
	}

	//This function takes the user lists returned by PHP and ut it into 'this'
	this.List.parsePhpData = function(userlists) {

		var _this = this;

		//We take care of analysing the list here
		$.each(userlists, function(i, list) {

			//Create a Lego brick list
			_this.lists[list.ID] = new LegoBrickList({
				"ID": list.ID,
				"name": list.listName,
				"createdOn": list.createdOn,
				"image" : (list.asset != "") ? list.asset : _this.parent.defaultSetImage,
			});

			//Add all bricks to the list
			$.each(list.bricks, function(i, brick) {

				//Create a brick object
				var b = new LegoElement({
					'ID' : parseInt(brick.elementID),
					'designid' : parseInt(brick.designID),
					'asset' : _this.parent.LEGOBaseURL + brick.Asset,
					'assetRaw': brick.Asset,
					'ImageBaseUrl': _this.parent.LEGOBaseURL,
					'itemDesc' : brick.ItemDescr,
				});

				//Set the color
				b.setColorFromStr(brick.ColourDescr);

				//Now that the brick object is created, we add the brick to the list
				_this.lists[list.ID].addBrick(b, parseInt(brick.qte));

			});
		});
	}

	//This function takes care of the Logout procedure
	this.List.Logout = function() {

		//We keep this secured
		var _this = this;

		//We get user data
		$.post( this.parent.users_base_url + "?action=logout", function( reponse ) {

			//This will ned need to be replace somehere else...
			_this.parent.handleError(reponse);

			//Reload the list
			_this.LoadUsers();
		}, 'json');
	}

	//This function takes care of analysing the lists and displaying the list of the lists
	this.List.setupMainList = function() {

		//Preserve this
		var _this = this;

		//Empty the
		$(this.UI.Main).find(this.UI.Mainlist).find(this.UI.Lists).html("");

		//Go trought each liat title
		$.each(this.lists, function(listID, listData) {

			//Grab the template
			var t = $(_this.UI.Main).find(_this.UI.Templates).find("#listElementTemplate").clone();

			//First, remove the id
			$(t).attr('id', '');

			//Set the data inside template
			$(t).find(".panel-heading").html( listData.getProperty('name') );
			$(t).find("img").attr('src', listData.getProperty('image') );
			$(t).find("p.nbPieces > span").html( listData.getNbBricks() );
			$(t).find("p.nbElements > span").html( listData.getNbElements() );
			$(t).data("listID", listID);

			//Taking care of formating the dates
			//See: http://momentjs.com/
			$(t).find("p.createdOn > span").html( moment( listData.getProperty('createdOn') * 1000 ).format('LLL') );


			//Add to the DOM destination
			$(t).appendTo($(_this.UI.Main).find(_this.UI.Mainlist).find(_this.UI.Lists));
		});

		//Show the list
		this.UI_ShowMain();

	}

	this.List.getNewListName = function() {

		//Preserve this
		var _this = this;

		//Call Bootbox Prompt
		bootbox.prompt("Please enter your new list name", function(result) {
		  if (result != null && result != "") {
		  	_this.CreateList(result, null, function(success, newListID) {

			  	//Reload the list
				_this.setupMainList();
		  	});
		  }
		});
	}

	this.List.Save_createNewList = function(listName, Asset, parts) {

		//Keep this safe
		var _this = this;

		this.CreateList( listName, Asset, function (success, newListID) {

			if (success) {

				//Add all the bricks to the selected listID
				_this.addElements(newListID, parts, function() {

					//Hide the spinner
					$("#SavingModalSpinner").modal('hide');

					//Reload the main lists
					_this.setupMainList();

					//Go to lists
					_this.parent.Navigation.Go(".nav-app-list");

					//And show the list of lists
					_this.UI_ShowLists();
				});

			} else {

				//Hide the spinner
				$("#SavingModalSpinner").modal('hide');
			}
		});
	}

	this.List.CreateList = function(listName, listAsset, callback) {

		//Preserve this
		var _this = this;

		//List Name is necesery
		if (listName == null || listName == false || listName == "") {
			console.warn("List - CreateList : List name can't be empty");
			return;
		}

		//But listAsset is not!
		if (listAsset == null || listAsset == false) {
			listAsset = "";
		}

		//Send to PHP!
		$.post( _this.parent.users_base_url + "?action=createList", {'listName' : listName, 'listAsset': listAsset}, function( reponse ) {

			//This will ned need to be replace somehere else...
			_this.parent.handleError(reponse);

			//Process reponse
			if (reponse.success) {

				//Add the list to the lists
				_this.lists[reponse.newListID] = new LegoBrickList({
					"ID": reponse.newListID,
					"name": listName,
					"createdOn": reponse.createdOn,
					"image" : (listAsset != "") ? listAsset : _this.parent.defaultSetImage,
				});

				//Do the callback !
				callback(true, reponse.newListID);

			} else {

				callback(false);
			}
		}, 'json');
	}

	//This function is called when a list is selected. It define the current list and display it
	this.List.showList = function(element) {

		//Get the list data
		this.active = $(element).data('listID');

		//Refresh the current list
		this.refreshList();
	}

	//This function is used to display a list in the HTML table
	this.List.refreshList = function() {

		//Reset the table
		this.UI_resetPartsTable();

		//Keep this safe
		var _this = this;

		//Setup everything
		$(this.UI.Main).find(this.UI.Mainlist).find(this.UI.ListDetail).find(".panel-heading").html( this.lists[this.active].getProperty('name') );
		$(this.UI.Main).find(this.UI.Mainlist).find(this.UI.ListDetail).find(".nbPieces > span").html( this.lists[this.active].getNbBricks() );
		$(this.UI.Main).find(this.UI.Mainlist).find(this.UI.ListDetail).find(".nbElements > span").html( this.lists[this.active].getNbElements() );
		$(this.UI.Main).find(this.UI.Mainlist).find(this.UI.ListDetail).find(".createdOn > span").html( moment( this.lists[this.active].getProperty('createdOn') * 1000 ).format('LLL') );
		$(this.UI.Main).find(this.UI.Mainlist).find(this.UI.ListDetail).find("img").attr('src', this.lists[this.active].getProperty('image') );

		//Show the previous button and hide the create list
		$(this.UI.Main).find(this.UI.Mainlist).find(this.UI.ListDetail).show();		//Show the List Detail
		$(this.UI.Main).find(this.UI.Mainlist).find(this.UI.Lists).hide();			//Hide the list
		$(this.UI.Main).find(this.UI.Mainlist).find(this.UI.listCreateForm).hide(); //Hide the create list
		$(this.UI.Main).find(this.UI.Mainlist).find(this.UI.listPrevious).show();	//Show the previous button

		//Sort the list
		//Be careful here: sorted list will ONLY return an array of elementID (keys) based on the order the list needs to be displayed.
		//We don't send the whole object sorted because apparently that CAN'T be done.
		var sortedList = this.parent.SortList(this.lists[this.active].getBricks(), this.SortValue, this.SortOrder);

		//We add each brick to the table.
		//Again, sortedList is an array of elementIDs... Be carefull
		for (var key in sortedList) {
			this.parent.AddElementToTable(
				$(this.UI.Main).find(this.UI.Mainlist + " > .listContentPlaceholder > table > tbody"),	// Destination
				$(this.UI.Main).find(this.UI.PartsTableSource), 										// Source
				this.lists[this.active].getBrick(sortedList[key])										// Brick
			);
		}

		//We process and add the total row
		//this.Analyse_addTotalRow();
		//We set the value in the template
		//this.lists[this.active].getNbElements()
		$(this.UI.Main).find(this.UI.PartsTableSource).find(".templateTable_Totalrow").find(".txtTotal").html( this.lists[this.active].getValue(true) );

		//We copy the total row to the pannel
		$(this.UI.Main).find(this.UI.PartsTableSource).find(".templateTable_Totalrow").clone().appendTo($(this.UI.Main).find(this.UI.Mainlist + " > .listContentPlaceholder > table > tfoot"));

	}

	//This function analyse the parts list and found each part info from LEGO service
	this.List.Analyse = function() {

		//Don't do anything if the list is empty
		if (this.lists[this.active].getNbElements() <= 0) {
			return;
		}

		//Reset the table
		this.UI_resetPartsTable();

		//Hide the table
		$(this.UI.Main).find(this.UI.Mainlist + " > .listContentPlaceholder > table").hide();

		//Disabled the buttons
		this.UI_disableButtons();

		//Show the progress
		this.UI_Progress_init();

		//Variable to keep progress of the current number of part processed
		var currentPart = 0;

		//We are going into .each. We need to make "this" safe
		var _this = this;

		var bricks = this.lists[this.active].getBricks();

		//We add each brick to the table
		for (var key in bricks) {

			//Start with analaytics
			this.parent.SendAnalytics(this.parent.bricks_base_url + bricks[key].data.getProperty('ID') + "&country=" + this.parent.country, "Get item or design from list");

			$.ajax({

				method: "GET",
				timeout: _this.parent.AjaxTimeout * 1000,
				url: this.parent.bricks_base_url + bricks[key].data.getProperty('ID') + "&country=" + this.parent.country,

			}).always(function(data) {

				//We use always because of the timeout because we want to catch cancel and not block
				//the UI. This help checkout error.
				if (data.statusText != null) {

					//!TODO: Show error to the user

					//Send error to console
					console.warn("Error in AJAX request", data);

				} else if (data.Bricks == null) {

					//!TODO Show error to user
					console.warn("Element " + data.REQUEST + " not found", data);

				} else {

					//Send to db cache
					_this.parent.sendLEGODataToCache(data);

					//Get the brick and put it a var for shortcut
					var brick = _this.lists[_this.active].getBrickElement(data.REQUEST);

					//Just to make sure... We don't want weird error in the next few lines
					if (brick == null) {
						console.warn("Something went wrong. Part " + data.REQUEST + " has vanished!");
					}

					//Update the price from the list brick element
					brick.data.setProperty("price", data.Bricks[0].Price);
					brick.data.setProperty("currency", data.Bricks[0].CId);

					//We will also update other infos, just in case
					//N.B.: We shoul'd have to touch the color
					brick.data.setProperty("asset", data.ImageBaseUrl + data.Bricks[0].Asset);
					brick.data.setProperty("assetRaw", data.Bricks[0].Asset);
					brick.data.setProperty("ImageBaseUrl", data.ImageBaseUrl);
					brick.data.setProperty("designid", data.Bricks[0].DesignId);
					brick.data.setProperty("itemDesc", data.Bricks[0].ItemDescr);
					brick.data.setProperty("stock", data.Bricks[0].SQty);
				}

				//We update the progress. Outside the previous if block so even with
				//an error we continue to the next part.
			    currentPart++;
			    _this.UI_Progress_update(currentPart);


				//Check if we are done
			    if (currentPart >= _this.lists[_this.active].getNbElements()) {

					//Shutdown the progress bar
					_this.UI_Progress_done();

					//Reload the list
					_this.refreshList();

					//We show the table
					_this.UI_showPartsTable();

					//To set the buttons, we reable them and disabled again with the switch
					_this.UI_resetButtons();
				}
			});
		}
	}

	//This function is called by the UI to change the order of the list.
	//It only change the global param and refresh the list. The refresh function take care of the actual sorting
	this.List.SortTable = function(SortBy, Order) {

		//Save the order
		this.SortValue = SortBy;
		this.SortOrder = Order;

		//Refresh the list
		this.refreshList();
	}

	this.List.setupAddButton = function(destination) {

		//Ref. for the idea of the dropdown:
		//http://www.bootply.com/9CvIygzob8

		//If there's no list, we hide the destination and quit
		if (Object.keys(this.lists).length == 0) {
			$(destination).hide();
			return;
		}

		//Cleanup the old stuff
		$(destination).find(".dropdown-menu").html("");

		//Keep this safe
		var _this = this;

		//Do something for each list
		$.each(this.lists, function(i, data) {
			$(destination).find(".dropdown-menu").append('<li><a href="javascript:void(0);" onclick="App.updateAddButton(this)" data-listid="' + i + '">' + data.getProperty('name') + '</a></li>');
		});

		//If the user havn't looked at his list yet, we won't have a currentList defined ( = 0 )
		//So we pick the first one.
		if (this.active == 0) {

			//Get the first key
			//Ref.: http://stackoverflow.com/a/11509718
			var i = Object.keys(this.lists)[0];

		} else {

			var i = this.active;
		}

		//Setup the current one
		$(destination).find(".btn-select > span.txt").html(this.lists[i].getProperty('name'));
		$(destination).data('listid', i);
	}

	this.List.setupWholeListAddButton = function(destination, func) {

		//Ref. for the idea of the dropdown:
		//http://www.bootply.com/9CvIygzob8

		//If there's no list, we hide the destination and quit
		if (Object.keys(this.lists).length == 0) {
			$(destination).find(".divider").hide();
			return;
		}

		//Cleanup the old stuff
		$(destination).find(".listElement").remove();
		$(destination).find(".divider").show();

		//Keep this safe
		var _this = this;

		//Do something for each list
		for (var i in this.lists) {
			$(destination).find(".dropdown-menu").append('<li class="listElement"><a href="javascript:void(0);" onclick="'+func+'(this)" data-listid="' + i + '">' + this.lists[i].getProperty('name') + '</a></li>');
		}
	}

	this.List.addElement = function(listID, brick) {

		//Keep this safe
		var _this = this;

		//Make sure we have an ID
		if (brick.data.getProperty("ID") <= 0) {
			console.warn("List - addElement : Can't add brick to list if it doesn't have an element ID! ("+brick.data.getProperty("ID")+")");
			return;
		}

		//Post to PHP so the part is added to the list
		$.post( this.parent.users_base_url + "?action=addElementToList", {'listID' : listID, 'elementID' : brick.data.getProperty('ID')}, function( reponse ) {

			//This will ned need to be replace somehere else...
			_this.parent.handleError(reponse);

			//!TODO: Ajouter feedback dans l'UI

			//Add the element to the master list
			//We do it here, otherwise it will appear in the list, but the state won't be saved
			_this.lists[listID].addBrick(brick.data);

			//Reload the list if it's the current one
			if (listID == _this.active) {
				_this.refreshList();
			}

			//We also reload the main lists to propagate the part count change
			_this.setupMainList();
		}, 'json');
	}

	this.List.addElements = function(listID, LegoList, callback) {

		//Keep this safe
		var _this = this;

		//!TODO: Make sure you are connected

		//Go trough the list and build something we can send to PHP
		var query = new Array;
		for (var i in LegoList.getBricks()) {

			//We don't want to send brick which we don't have an ID
			if (LegoList.getBrick(i).data.getProperty("ID") > 0) {

				//Add the element to the master list
				//We should do it after PHP to avoid a the case where a brick will appear in the list, but the state isn't saved
				_this.lists[listID].addBrick(LegoList.getBrick(i).data, LegoList.getBrick(i).qte);

				//Add to the array that will be sent to PHP
				query.push({
					elementID: LegoList.getBrick(i).data.getProperty("ID"),
					qte: LegoList.getBrick(i).qte
				});
			}
		}

		//Post to PHP so the part is added to the list
		$.post( this.parent.users_base_url + "?action=addElementArrayToList", {'listID' : listID, 'data' : JSON.stringify(query) }, function( reponse ) {
			//This will ned need to be replace somehere else...
			_this.parent.handleError(reponse);

			callback();
		}, 'json');
	}

	this.List.deleteElement = function(brick) {

		//Keep this safe
		var _this = this;

		//Post to PHP so the part is delete from the list
		$.post( this.parent.users_base_url + "?action=delElementfromList", {'listID' : this.active, 'elementID' : brick.data.getProperty('ID')}, function( reponse ) {

			//This will ned need to be replace somehere else...
			_this.parent.handleError(reponse);

			//Delete the brick in teh lists and refresh the list
			_this.lists[_this.active].delBrick(brick);
			_this.refreshList();

			//We also reload the main lists to propagate the part count change
			_this.setupMainList();
		}, 'json');
	}

	this.List.editElementQte = function(brick, qte) {

		//Parse the qté as a int
		qte = parseInt(qte);

		//If qte if under 1, we stop right there
		if (qte < 1) {
			bootbox.alert("<i class='fa fa-exclamation-triangle red'></i> Quantity can't be less than 1");
			return;
		}

		//Keep this safe
		var _this = this;

		//Post to PHP so the part is delete from the list
		$.post( this.parent.users_base_url + "?action=editElementQte", {'listID' : this.active, 'elementID' : brick.data.getProperty('ID'), 'qte': qte}, function( reponse ) {

			//This will ned need to be replace somehere else...
			_this.parent.handleError(reponse);

			//Edit the qty in the list and refresh the list
			_this.lists[_this.active].setBrickQte(brick.data, qte);
			_this.refreshList();

			//We also reload the main lists to propagate the part count change
			_this.setupMainList();
		}, 'json');
	}

	this.List.deleteList = function() {

		//Keep this safe
		var _this = this;

		//Ask the question
		bootbox.confirm({
			title: "Delete list?",
			message: "Are you sure you want to delete the list '<strong>" + this.lists[this.active].getProperty('name')+"</strong>? Deleted lists cannot be recovered!",
			buttons: {
		        'cancel': {
		            label: 'Cancel',
		            className: 'btn-default pull-left'
		        },
		        'confirm': {
		            label: 'Do it !',
		            className: 'btn-danger pull-right'
		        }
		    },
		    callback: function(result) {
				if (result) {

			  		//Going for php
					$.post( _this.parent.users_base_url + "?action=deleteList", {'listID' : _this.active}, function( reponse ) {

						//This will ned need to be replace somehere else...
						_this.parent.handleError(reponse);

						//Delete the list in the
						delete _this.lists[_this.active];

						//Set active list to null
						_this.active = 0;

						//Go back to the list of lists
						_this.UI_ShowLists();

						//Same as creating list, we reload everything. Easier this way
						_this.setupMainList();
					}, 'json');

			  	}
			}
		});
	}

	 /*
	 * UI Functions
	 */

	//This function show the Spinner HTML element
	this.List.UI_ShowSpinner = function() {
		$(this.UI.Main).find(this.UI.Spinner).show();
		$(this.UI.Main).find(this.UI.Login).hide();
		$(this.UI.Main).find(this.UI.Register).hide();
		$(this.UI.Main).find(this.UI.Mainlist).hide();
		$(this.UI.Main).find(this.UI.listCreateForm).hide();
	}

	//This function shows the Registration HTML element
	this.List.UI_ShowRegister = function() {
		$(this.UI.Main).find(this.UI.Spinner).hide();
		$(this.UI.Main).find(this.UI.Login).hide();
		$(this.UI.Main).find(this.UI.Register).show();
		$(this.UI.Main).find(this.UI.Mainlist).hide();
		$(this.UI.Main).find(this.UI.listCreateForm).hide();
	}

	//This function shows the login HTML element
	this.List.UI_ShowLogin = function(successMsg) {
		$(this.UI.Main).find(this.UI.Spinner).hide();
		$(this.UI.Main).find(this.UI.Login).show();
		$(this.UI.Main).find(this.UI.Register).hide();
		$(this.UI.Main).find(this.UI.Mainlist).hide();
		$(this.UI.Main).find(this.UI.listCreateForm).hide();

		if (successMsg) {
			$(this.UI.Main).find(this.UI.Login).find(".alert-success").show();
			$(this.UI.Main).find(this.UI.Login).find(".alert-success > span").html(successMsg);
		} else {
			$(this.UI.Main).find(this.UI.Login).find(".alert-success").hide();
		}
	}

	//This function shows the list of lists
	this.List.UI_ShowMain = function() {
		$(this.UI.Main).find(this.UI.Spinner).hide();
		$(this.UI.Main).find(this.UI.Login).hide();
		$(this.UI.Main).find(this.UI.Register).hide();
		$(this.UI.Main).find(this.UI.Mainlist).show();
		$(this.UI.Main).find(this.UI.listCreateForm).show();
	}

	//This list show the list HTML
	this.List.UI_ShowLists = function() {
		$(this.UI.Main).find(this.UI.Mainlist).find(this.UI.ListDetail).hide();		//Hide the List Detail
		$(this.UI.Main).find(this.UI.Mainlist).find(this.UI.Lists).show();			//Show the list
		$(this.UI.Main).find(this.UI.Mainlist).find(this.UI.listCreateForm).show(); //Show the create list
		$(this.UI.Main).find(this.UI.Mainlist).find(this.UI.listPrevious).hide();	//Hide the previous button
	}

	//This function reset the parts table
	this.List.UI_showPartsTable = function() {

		//Show the table
		$(this.UI.Main).find(this.UI.Mainlist + " > .listContentPlaceholder > table").show();

		//We must also reset the Bootstrap Tooltips added with Javascript
		$('[data-toggle="tooltip"]').tooltip();
	}

	//This function reset the parts table
	this.List.UI_resetPartsTable = function() {
		$(this.UI.Main).find(this.UI.Mainlist + " > .listContentPlaceholder > table").find("tr:gt(0)").remove(); //Remove all lines
	}

	//This function disabled all button. Option can omit the destroy one
	this.List.UI_disableButtons = function() {

		$(this.UI.Main).find(this.UI.Mainlist).find(".btn").attr('disabled', 'disabled');
	}

	//This function reset the buttons state
	this.List.UI_resetButtons = function() {
		$(this.UI.Main).find(this.UI.Mainlist).find(".btn").removeAttr('disabled');
	}

	//This function set the analyser progress bar
	this.List.UI_Progress_init = function() {
		$(this.UI.Main).find(this.UI.Progress).show();
		$(this.UI.Main).find(this.UI.Progress).find("span.current").html("0");
		$(this.UI.Main).find(this.UI.Progress).find("span.totalnb").html( this.lists[this.active].getNbElements() );
		$(this.UI.Main).find(this.UI.Progress).find("div.progress-bar").css("width", "0%");
	}

	//This function update the analyser progress bar.
	this.List.UI_Progress_update = function(current) {
		$(this.UI.Main).find(this.UI.Progress).find("span.current").html(current+1);
		$(this.UI.Main).find(this.UI.Progress).find("div.progress-bar").css("width", (current/( this.lists[this.active].getNbElements() )*100)+"%");
	}

	//This function hide the analyser progress bar.
	this.List.UI_Progress_done = function() {
		$(this.UI.Main).find(this.UI.Progress).hide();
	}

	//Must check ig we're already loged in
	this.List.LoadUsers();
}

/*
 //! ------------- NAVIGATION -------------
 */

PBHelper.prototype.Navigation = function() {

	//Keep a link to PBHelper
	this.Navigation.parent = this;

	//This function is used for links in the menu
	this.Navigation.MenuSelect = function(element) {

		//Find the selected name
		var selected_nav = $(element).data("target");

		//Go fo it!
		this.Go("."+selected_nav);
	}

	//This general function is used to navigate the site elements
	this.Navigation.Go = function (SelectedClass) {

		//Reset all active
		$(".nav > li").removeClass("active");

		//Hide all the content
		$("div[class^=nav-app-]").hide();

		//Add the active on the selected one
		$(".nav > li"+SelectedClass).addClass("active");

		//Show the selected content
		$("div"+SelectedClass).show();

	}
}

/*
 //! ------------- Lego List -------------
 */

function LegoBrickList(initData) {

	/*
	 * Public variables
	 */



	/*
	 * Private variables
	 */

	var bricks = new Object();
	var properties = {};
	var listValue = 0;

	/*
	 * Public functions
	 */

	this.setProperties = function(data) {
		for (var key in data) {
			this.setProperty(key, data[key]);
		}
		return true;
	}

	this.setProperty = function(key, value) {
		if (key == "bricks") {
			console.warn("LegoBrickList : Property 'bricks' can't be set or overwritten this way.");
			return false
		} else {
			properties[key] = value;
			return true;
		}
	}

	this.getProperties = function() {
		return properties;
	}

	this.getProperty = function(key) {
		return properties[key];
	}

	this.addBrick = function(lego_element, qte) {

		//The specified brick needs to be a Lego Element object
		if (!(lego_element instanceof LegoElement)) {
			throw new Error("Specified brick is not a valid Lego element");
		}

		//Small shortcut fot the brick ID
		var position = this.getBrickElementPosition(lego_element.getProperty("ID"));


		//if quantity is undefined, we set it to 1
		if (qte == undefined) { qte = 1; }

		//Check if this brick already exist in the list
		if ( bricks[position] == undefined ) {

			//Get the next ID
			var i = this.getNbElements() + 1;

			//Add the brick to the list
			bricks[i] = new Object();
			bricks[i].qte = qte;
			bricks[i].data = lego_element;

		//It does exist...
		} else {

			//...increment the qte
			bricks[position].qte = bricks[position].qte + qte;
		}
	}

	this.setBrickQte = function(lego_element, qte) {

		//The specified brick needs to be a Lego Element object
		if (!(lego_element instanceof LegoElement)) {
			throw new Error("Specified brick is not a valid Lego element");
		}

		//Small shortcut fot the brick ID
		var position = this.getBrickElementPosition(lego_element.getProperty("ID"));

		//Make sure it's an it
		qte = parseInt(qte);

		//if quantity is undefined, we set it to 1
		if (qte == undefined || qte == "NaN") { return false; }

		//Check if this brick already exist in the list
		if ( bricks[position] == undefined ) {

			return false;

		//It does exist...
		} else {

			//...increment the qte
			bricks[position].qte = qte;
		}
	}

	this.delBrick = function(lego_element) {
		for (var i in bricks) {
			if (bricks[i] == lego_element) {
				delete bricks[i];
				return true;
			}
		}

		return false;
	}

	this.getBricks = function() {

		//Create the return variable
		var retour = new Object;

		//Parse each bricks to add the calculated data
		for (var i in bricks) {
			retour[i] = this.getBrick(i);
		}

		return retour;
	}

	this.getBrick = function(i) {

		//Store the brick data in a temp var
		temp = bricks[i];

		if (temp == null) {
			return null;
		}

		//Add calculated properties
		temp.value = 	getBrickValue(bricks[i].data, bricks[i].qte, false);
		temp.valueStr = getBrickValue(bricks[i].data, bricks[i].qte, true)

		//Done
		return temp;
	}

	this.getBrickElement = function(ID) {

		var i = this.getBrickElementPosition(ID);
		if (i == null) {
			return null;
		} else {
			return this.getBrick(i);
		}

		//If we didn't find anything, null will be returned
		return null;
	}

	this.getBrickElementPosition = function(ID) {

		for (var i in bricks) {
			if (this.getBrick(i).data.getProperty('ID') == ID) {
				return i;
			}
		}

		//If we didn't find anything, null will be returned
		return null;
	}

	this.getNbBricks = function() {

		var nb = 0;

		//Go trought all the bricks
		for (var key in bricks) {
			nb = nb + bricks[key].qte;
		}

		return nb;
	}

	this.getNbElements = function() {

		return Object.keys(bricks).length;
	}

	this.getValue = function(format) {

		var value = 0;

		//Go trought all the bricks
		for (var key in bricks) {
			value = value + bricks[key].value;
		}

		if (format) {
			return (Math.round(value * 100) / 100).toFixed(2) + " $";
		} else {
			return value;
		}
	}

	this.testString = function() {
		var reponse = 'var a = angular.element(document.getElementsByClassName("rp")).scope(); var b = angular.element(document.getElementsByClassName("rp-bag-list")).scope();';
		for (var key in bricks) {
			brick = this.getBrick(key);
			if (brick.data.getProperty('stock') >= brick.qte) {

				for (i = 0; i < brick.qte; i++) {

					var t = {
						"DesignId": brick.data.getProperty('designid'),
						"colorCode": brick.data.getProperty('color'),
						"nbReq": brick.qte,
						"ItemNo": brick.data.getProperty('ID'),
						"ItemDescr": brick.data.getProperty('itemDesc'),
						//"ColourLikeDescr":"Black",
						"ColourDescr": brick.data.getProperty('colorStr'),
						//"MaingroupDescr":"Bricks, Special Circles And Angles",
						"Asset": brick.data.getProperty('assetRaw'),
						//"MaxQty":200,
						"Ip":false,
						"Price": brick.data.getProperty('price'),
						"CId": " $"+brick.data.getProperty('currency'), //" $CAD",
						"SQty": brick.data.getProperty('stock'),
						//"PriceStr":"CAD 0.08",
						//"PriceWithTaxStr":"CAD 0.08",
						"ItemUnavailable":false,
						"UnavailableLink":null,
						"UnavailableReason":null,
						"baseUrl":"https://mi-od-live-s.legocdn.com"
					}

					//Add to response
					reponse = reponse + 'a.addToBasket(' + JSON.stringify(t) + ', b);';
				}
			}
			//console.log(brick, brick.data.getProperties());
		}

		reponse = reponse + 'angular.element(document.getElementsByClassName("rp")).scope().$apply();';
		return reponse;
	}

	/*
	 * Private functions
	 */

	function getBrickValue(brick, qte, format) {

		//Get the properties and put them in the return object
		var price = brick.getProperty('price');

		//Calculate the total, format and return
		if (format) {

			//Take care of the errors
			if (price <= 0) {

				return "-";

			} else {

				retour = (Math.round(price * qte * 100) / 100).toFixed(2) + " $";

				//Add currency if defined
				if (brick.getProperty('currency') != "" && brick.getProperty('currency') != null) {
					retour = retour + brick.getProperty('currency');
				}

				return retour;
			}

		} else {

			//Use the max with 0. If the Price is negative (error), we send back 0
			return Math.max(0, (Math.round(price * qte * 100) / 100).toFixed(2));
		}
	}

	/*
	 * Init code
	 */

	if (typeof(initData) == "object") {

		for (var key in initData) {
			this.setProperty(key, initData[key]);
		}

	 } else if (initData != undefined) {
		 console.warn("LegoBrickList : initData ignored - Invalid object.");
	 }

	 return true;
}

/*
 //! ------------- Lego Element -------------
 */

function LegoElement(initData) {

	/*
	 * Public variables
	 */

	/*
	 * Private variables
	 */

	//var ID = ID;
	var colorCode = 0;
	var colorLegoStr = "";
	var properties = {
		'ID' : 0,
		'designid' : 0,
		'asset' : "assets/img/defaultimg.gif",
		'itemDesc' : "",
		'price' : 0,
		'currency': "",
		'stock': -1,
		'assetRaw': '',
		'ImageBaseUrl': ''
	};

	/*
	 * Public functions
	 */

	this.setProperty = function(key, value) {

		//Check value
		if (value == null) {
			console.warn("LegoElement : Property '" + key +"' cannot be set to null");

		} else if (properties[key] != null) {
			properties[key] = value;

		} else {
			console.warn("LegoElement : Property '" + key +"' can't be set or overwritten.");
		}
	}

	this.setColor = function(code) {

		//Make sure it's an INT
		code = parseInt(code);

		//Check the param
		if (typeof(code) != "number" || code <= 0) {
			throw new Error("LegoElement : Invalid color code -> " + code);
		}

		//Do it
		colorCode = code;
	}

	this.setColorFromStr = function(colorStr) {

		//Get a code
		code = getColorCodeFromLegoStr(colorStr);

		//Check for error (-1)
		if (code <= 0) {
			console.warn("LegoElement : Cannot match LEGO color string to color Code (" + colorStr + ")");
		}

		//Do it
		colorCode = code;
		colorLegoStr = colorStr;
	}

	this.getProperties = function() {

		//Store the properties in a temp var
		temp = properties;

		//Add privates and computed properties
		temp['priceStr'] = getPriceString();
		temp['color'] = colorCode;
		temp['colorName'] = getColorName(colorCode);
		temp['colorStr'] = getColorLegoStr(colorCode);

		//Returned the computed properties
		return temp;
	}

	this.getProperty = function(key) {

		//Cutom property 'ID'
		if (key == "priceStr") {
			return getPriceString();

		} else if (key == "color") {
			return colorCode;

		} else if (key == "colorName") {
			return getColorName(colorCode);

		} else if (key == "colorStr") {
			return getColorLegoStr(colorCode);

		//Take take of everything in the "public" properties
		} else {
			return properties[key];
		}
	}

	/*
	 * Private functions
	 */

	function getPriceString() {

		//Case n° 1 : Price has not been defined yet
		if (properties.price == 0) {

			return "-";

		} else {

			//Return the defined price
			retour = (Math.round(properties.price * 100) / 100).toFixed(2) + " $";

			//Add currency if defined
			if (properties.currency != "" && properties.currency != null) {
				retour = retour + properties.currency;
			}

			return retour;
		}

	}

	function getColorCodeFromLegoStr(colorStr) {

		//Gro throught all the colors
		for (var code in LEGO_Color) {

			//Check for all the codes if we can find a match
			if (LEGO_Color[code].LegoID != null && colorStr != null && LEGO_Color[code].LegoID.toLowerCase() === colorStr.toLowerCase()) {

				//Return the current code
				return code;
			}
		}

		return -1;

	}

	function getColorName(colorCode) {

		//Get the color from the
		if (LEGO_Color[colorCode] != null) {

			return LEGO_Color[colorCode].Name;

		//In case we have some string we can use
		} else if( colorLegoStr != "") {

			return colorLegoStr;

		//Nope. Return nothing
		} else {
			return "";
		}
	}

	function getColorLegoStr(colorCode) {

		//Get the color from the
		if (LEGO_Color[colorCode] != null) {

			return LEGO_Color[colorCode].LegoID;

		//Nope. Return nothing
		} else {
			return "";
		}
	}

	 /*
	 * Init code
	 */

	 if (typeof(initData) == "object") {

		for (var key in initData) {
			this.setProperty(key, initData[key]);
		}

	 } else if (initData != undefined) {
		 console.warn("LegoElement : initData ignored - Invalid object.", initData);
	 }

	 return true;

}

/*
 //! ------------- Cookie Helper -------------
 */
PBHelper.prototype.cookieHelper = function() {

    this.cookieHelper.get = function(a) {
        for (var b = a + "=", c = document.cookie.split(";"), d = 0; d < c.length; d++) {
            for (var e = c[d];
                " " == e.charAt(0);) e = e.substring(1);
            if (0 === e.indexOf(b)) return e.substring(b.length, e.length)
        }
        return ""
    }

    this.cookieHelper.set = function(a, b, c) {
	    //NB.: 	a = name
	    //		b = value
	    //		c = Temp (en heures)
        var d = new Date;
        d.setTime(d.getTime() + 3600 * c * 1e3);
        var e = "expires=" + d.toUTCString();
        document.cookie = a + "=" + b + "; " + e + ";path=/"
    }
}

function qtePlus(element) {
	$(element).parent().find('input').val( parseInt($(element).parent().find('input').val()) + 1 );
}
function qteMinus(element) {
	$(element).parent().find('input').val( parseInt($(element).parent().find('input').val()) - 1 );
}