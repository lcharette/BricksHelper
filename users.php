<?php

	$db_host = "localhost";
	$db_user = "LEGO";
	$db_pass = "PVu-Sbg-2R7-epp";
	$db_name = "LEGO";

	//Get var
	$action = $_GET['action'];

	//Prepare le retour
	$retour = array();

	switch ($action) {

		case 'register':

			//Get all the data
			$name = $_POST['name'];
			$email = $_POST['email'];
			$pass1 = $_POST['pass1'];
			$pass2 = $_POST['pass2'];

			//Check if all field have something in it
			/*if (name.length == 0 || email.length == 0 || pass1.length == 0 || pass2.length == 0) {
			 $(this.UI.Main).find(this.UI.Register).find(".alert").show();
			 $(this.UI.Main).find(this.UI.Register).find(".alert > span").html("Please fill in all the fields");
			 return;
			}

			//Check if the two password are the same
			if (pass1 != pass2) {
			 $(this.UI.Main).find(this.UI.Register).find(".alert").show();
			 $(this.UI.Main).find(this.UI.Register).find(".alert > span").html("The two password are not the same");
			 return;
			}*/


		break;
		case 'login':


		break;

		default:

			returnPage(array(
				'errorCode' => 401,
				'msg' => "No Action",
			));

		break;
	}

	function returnPage($data) {

		//Check for missing stuff. Add default values
		$data['success'] = (isset($data['success'])) ? $data['success'] : false;
		$data['msg'] = (isset($data['msg'])) ? $data['msg'] : "";
		$data['errorCode'] = (isset($data['errorCode'])) ? $data['errorCode'] : 200;
		$data['errorDetail'] = (isset($data['errorDetail'])) ? $data['errorDetail'] : "";
		$data['data'] = (isset($data['data'])) ? $data['data'] : array();

		//Retourne
		echo json_encode($data);
		exit;
	}
?>