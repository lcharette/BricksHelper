<?php

error_reporting(E_ALL);
ini_set("display_errors", 1);

require_once("config.php");
require_once("functions_mysql.php");
require_once("functions_sessions.php");

//Prépare MySQL
$MySQL = new MySQL();

//On démarre la session
$session = new session();

	//Get var
	$action = request_var('action', '');

	//Prepare le retour
	$retour = array();

	switch ($action) {

		//! REGISTER
		case 'register':

			//Get all the data
			$name = request_var('name', '');
			$email = request_var('email', '');
			$pass1 = request_var('pass1', '');
			$pass2 = request_var('pass2', '');

			//Check if all field have something in it
			if ($name == "" || $email == "" || $pass1 == "" || $pass2 == "") {
				returnPage(array(
					'errorCode' => 402,
					'errorDetail' => "Missing param",
				));
			}

			//Check if the two password are the same
			if ($pass1 != $pass2) {
				returnPage(array(
					'errorCode' => 403,
					'errorDetail' => "Pass mismatch param",
				));
			}

			//check if email already registered
			$ligne = $MySQL->select_one('users', '*', array('email' => $email));

			if (isset($ligne) && !empty($ligne)) {
				returnPage(array(
					'errorCode' => 404,
					'errorDetail' => "Email already registered",
				));
			}

			//Register everything
			$userid = $MySQL->insert("users", array(
				"username" 		=> $name,
				"password"		=> crypt(md5($pass1)),
				"email"			=> $email,
				"registerdate"	=> time(),
			));

			returnPage(array(
				'success' 	=> true,
				'data' 		=> array(
					"user_id"	=> $userid
				)
			));

		break;

		//! LOGIN
		case 'login':

			//Check if already loggedin
			if ($session->user['logged_in']) {
				returnPage(array(
					'errorCode' => 407,
					'errorDetail' => "Already logged in",
				));
			}

			//Get all the data
			$email = request_var('email', '');
			$pass = request_var('pass', '');

			//Login using session class
			$reponse = $session->login($email, $pass);

			//Vérifie si on a pas d'erreurs
			if (count($reponse) == 0 ) {

				returnPage(array(
					'success' 	=> true
				));

			} else {

				returnPage(array(
					'errorCode' => 405,
					'errorDetail' => implode("; ", $reponse),
				));

			}

		break;

		//!LIST
		case 'List':

			//Check if we are logged in
			if (!$session->user['logged_in']) {

				returnPage(array(
					'errorCode' => 406,
					'errorDetail' => "Not logged in",
				));

			} else {

				//Prepare the return array
				$retour = array();

				//We get user lists
				$results = $MySQL->select("userlists", "*", array("user_id" => $session->user['data']['user_id']), array("createdOn" => "DESC"));

				//Passe chacune des lists pour trouver leurs éléments
				foreach ($results as $list) {

					//We get user lists
					$bricks = $MySQL->query("SELECT l.elementID, l.qte, e.designID, e.ColourDescr, e.ItemDescr, e.Asset FROM " . $MySQL->DBprfx . "listElements l LEFT JOIN " . $MySQL->DBprfx . "elementCache e ON l.elementID=e.elementID WHERE l.listID = " . $list['ID'] . " ORDER BY l.elementID DESC");

					//On va parcourir "bricks" parce que l'on veut que l'elementID soit la clé de l'array
					foreach ($bricks as $brick) {
						//Ajoute les pièces à la liste
						$list['bricks'][$brick['elementID']] = $brick;
					}

					//Ajoute au array de retour. On associe sur l'ID de la liste
					$retour[$list['ID']] = $list;
				}

				//Return everything
				returnPage(array(
					'success' 	=> true,
					'data'	=> array(
						'userdata' => $session->user['data'],
						'userlists' => $retour
					)
				));
			}

		break;

		//! EDIT USER
		case 'editUser':

			//We need to be logged in. Make sure of that and get user_id
			if (!$session->user['logged_in']) {
				returnPage(array(
					'errorCode' => 408,
					'errorDetail' => "Not logged in",
				));
			}

			//Get the action
			$formAction = request_var('formAction', '');

			switch($formAction) {
				case 'username':

					//Get the var
					$name = request_var('name', '');

					//Make sure it's not empty
					if ($name == "") {
						returnPage(array(
							'errorCode' => 402,
							'errorDetail' => "Missing param",
						));
					}

					//Update MySQL
					$MySQL->update("users", array('username' => $name), array("user_id" => $session->user['data']['user_id']));

				break;

				case 'password':

					//Get the var
					$pass0 = request_var('pass0', '');
					$pass1 = request_var('pass1', '');
					$pass2 = request_var('pass2', '');

					//Make sure it's not empty
					if ($pass0 == "" || $pass1 == "" || $pass2 == "") {
						returnPage(array(
							'errorCode' => 402,
							'errorDetail' => "Missing param",
						));
					}

					//Check if the two password are the same
					if ($pass1 != $pass2) {
						returnPage(array(
							'errorCode' => 403,
							'errorDetail' => "Pass mismatch param",
						));
					}

					//Check the old password
					$ligne = $MySQL->select_one('users', 'password', array('user_id' => $session->user['data']['user_id']));

					if (crypt(md5($pass0), $ligne['password']) != $ligne['password']) {
						returnPage(array(
							'errorCode' => 412,
							'errorDetail' => "Old password mismatch",
						));
					}

					//We can now do it
					$MySQL->update("users", array('password' => crypt(md5($pass1)) ), array("user_id" => $session->user['data']['user_id']));

				break;

				default:
					returnPage(array(
						'errorCode' => 413,
						'errorDetail' => "No Form Action",
					));
				break;
			}

			//Return everything
			returnPage(array('success' 	=> true));

		break;

		//! DELETE ACCOUNT
		case 'deleteAccount':

			//We need to be logged in. Make sure of that and get user_id
			if (!$session->user['logged_in']) {
				returnPage(array(
					'errorCode' => 408,
					'errorDetail' => "Not logged in",
				));
			}

			//Do it. Use the userID again for additionnal security
			$MySQL->delete("users", array("user_id" => $session->user['data']['user_id']));

		//no break

		//! LOGOUT
		case 'logout':

			$session->logout();
			returnPage(array('success' 	=> true));

		break;

		//! CREATE LIST
		case 'createList':

			//We need to be logged in. Make sure of that and get user_id
			if (!$session->user['logged_in']) {
				returnPage(array(
					'errorCode' => 408,
					'errorDetail' => "Not logged in",
				));
			}

			//Get the list name
			$listName = request_var('listName', '');
			$listAsset = request_var('listAsset', '');

			//Check for empty name
			if ($listName == "") {
				returnPage(array(
					'errorCode' => 409,
					'errorDetail' => "List name can't be blank",
				));
			}

			//Ok, on ajoute dans MySQL
			$ID = $MySQL->insert("userlists", array(
				"user_id" 		=> $session->user['data']['user_id'],
				"listName"		=> addslashes($listName),
				"createdOn"		=> time(),
				"asset"			=> $listAsset
			));

			//Retourne un succès
			returnPage(array(
				'success' 	=> true,
				'newListID' => $ID,
				'createdOn' => time()
			));

		break;

		//! DELETE LIST
		case 'editListName':

			//We need to be logged in. Make sure of that and get user_id
			if (!$session->user['logged_in']) {
				returnPage(array(
					'errorCode' => 408,
					'errorDetail' => "Not logged in",
				));
			}

			//Get the post data
			$listID = request_var('listID', 0);
			$listName = request_var('listName', '');

			//Check for empty name
			if ($listName == "") {
				returnPage(array(
					'errorCode' => 409,
					'errorDetail' => "List name can't be blank",
				));
			}

			//Get infos from the list. This is just make sure the list is owned by the user
			$result = $MySQL->select_one("userlists", "*", array("user_id" => $session->user['data']['user_id'], "AND ID" => $listID));

			if (empty($result)) {
				returnPage(array(
					'errorCode' => 410,
					'errorDetail' => "List not owned",
				));
			}

			//Do it. Use the userID again for additionnal security
			$MySQL->update("userlists", array('listName' => addslashes($listName)), array("user_id" => $session->user['data']['user_id'], "AND ID" => $listID));

			//Retourne un succès
			returnPage(array(
				'success' 	=> true,
			));

		break;

		//! DELETE LIST
		case 'deleteList':

			//We need to be logged in. Make sure of that and get user_id
			if (!$session->user['logged_in']) {
				returnPage(array(
					'errorCode' => 408,
					'errorDetail' => "Not logged in",
				));
			}

			//Get the post data
			$listID = request_var('listID', 0);

			//Get infos from the list. This is just make sure the list is owned by the user
			$result = $MySQL->select_one("userlists", "*", array("user_id" => $session->user['data']['user_id'], "AND ID" => $listID));

			if (empty($result)) {
				returnPage(array(
					'errorCode' => 410,
					'errorDetail' => "List not owned",
				));
			}

			//Do it. Use the userID again for additionnal security
			$MySQL->delete("userlists", array("user_id" => $session->user['data']['user_id'], "AND ID" => $listID));

			//Retourne un succès
			returnPage(array(
				'success' 	=> true,
			));

		break;

		//! ADD ELEMENT TO LIST
		case 'addElementToList':

			//We need to be logged in. Make sure of that and get user_id
			if (!$session->user['logged_in']) {
				returnPage(array(
					'errorCode' => 408,
					'errorDetail' => "Not logged in",
				));
			}

			//Get the list ID
			$listID = request_var('listID', 0);
			$elementID = request_var('elementID', 0);

			//Check for empty values
			if ($listID == 0 || $elementID == 0) {
				returnPage(array(
					'errorCode' => 402,
					'errorDetail' => "Missing param",
				));
			}

			//Get infos from the list
			$result = $MySQL->select_one("userlists", "*", array("user_id" => $session->user['data']['user_id'], "AND ID" => $listID));

			if (empty($result)) {
				returnPage(array(
					'errorCode' => 410,
					'errorDetail' => "List not owned",
				));
			}

			//!TODO : Changer pour le même fonction que le cache
			//Same thing with the part to see if we need an insert or update
			$result_element = $MySQL->select_one("listElements", "ID, qte", array("elementID" => $elementID, "AND listID" => $listID));

			//Insert or update
			if (empty($result_element)) {

				$MySQL->insert("listElements", array(
					"listID"	=> $listID,
					"elementID"	=> $elementID,
					"qte" 		=> 1
				));

			} else {
				$MySQL->update("listElements", array('qte' => ($result_element['qte'] + 1)), array('ID' => $result_element['ID']));
			}

			returnPage(array(
				'success' 	=> true,
			));

		break;

		//! ADD ELEMENT ARRAY TO LIST
		case 'addElementArrayToList':

			//We need to be logged in. Make sure of that and get user_id
			if (!$session->user['logged_in']) {
				returnPage(array(
					'errorCode' => 408,
					'errorDetail' => "Not logged in",
				));
			}

			//Get the list ID
			$listID = request_var('listID', 0);
			$data = request_var('data', "");

			//Check for empty values
			if ($listID == 0 || $data == "") {
				returnPage(array(
					'errorCode' => 402,
					'errorDetail' => "Missing param",
				));
			}

			//Decode JSON
			$data = json_decode($data, true);

			//Get infos from the list
			$result = $MySQL->select_one("userlists", "*", array("user_id" => $session->user['data']['user_id'], "AND ID" => $listID));

			if (empty($result)) {
				returnPage(array(
					'errorCode' => 410,
					'errorDetail' => "List not owned",
				));
			}

			//!TODO : Changer pour le même fonction que le cache
			//Same thing with the part to see if we need an insert or update
			foreach($data as $i => $brick) {

				$result_element = $MySQL->select_one("listElements", "ID, qte", array("elementID" => $brick['elementID'], "AND listID" => $listID));

				//Insert or update
				if (empty($result_element)) {

					$MySQL->insert("listElements", array(
						"listID"	=> $listID,
						"elementID"	=> $brick['elementID'],
						"qte" 		=> $brick['qte']
					));

				} else {
					$MySQL->update("listElements", array('qte' => ($result_element['qte'] + $brick['qte'])), array('ID' => $result_element['ID']));
				}
			}

			returnPage(array(
				'success' 	=> true,
			));

		break;

		//! DEL ELEMENT FROM LIST
		case 'delElementfromList':

			//We need to be logged in. Make sure of that and get user_id
			if (!$session->user['logged_in']) {
				returnPage(array(
					'errorCode' => 408,
					'errorDetail' => "Not logged in",
				));
			}

			//Get the post data
			$listID = request_var('listID', 0);
			$elementID = request_var('elementID', 0);

			//Get infos from the list. This is just make sure the list is owned by the user
			$result = $MySQL->select_one("userlists", "*", array("user_id" => $session->user['data']['user_id'], "AND ID" => $listID));

			if (empty($result)) {
				returnPage(array(
					'errorCode' => 410,
					'errorDetail' => "List not owned",
				));
			}

			//Do it
			$MySQL->delete("listElements", array(
				"elementID" => $elementID,
				"AND listID" => $listID
			));


			returnPage(array(
				'success' 	=> true,
			));

		break;

		//! EDIT ELEMENT QTE
		case 'editElementQte':


			//We need to be logged in. Make sure of that and get user_id
			if (!$session->user['logged_in']) {
				returnPage(array(
					'errorCode' => 408,
					'errorDetail' => "Not logged in",
				));
			}

			//Get the post data
			$listID = request_var('listID', 0);
			$elementID = request_var('elementID', 0);
			$qte = request_var('qte', 0);

			//If qty is less than 1, we stop right there
			if ($qte < 1) {
				returnPage(array(
					'errorCode' => 411,
					'errorDetail' => "Qty can't be less than 1",
				));
			}


			//Get infos from the list. This is just make sure the list is owned by the user
			$result = $MySQL->select_one("userlists", "*", array("user_id" => $session->user['data']['user_id'], "AND ID" => $listID));

			if (empty($result)) {
				returnPage(array(
					'errorCode' => 410,
					'errorDetail' => "List not owned",
				));
			}

			//Do it
			$MySQL->update(
				"listElements",					//	FROM
				array('qte' => $qte),			//	WHAT
				array(							// WHERE
					"elementID" => $elementID,
					"AND listID" => $listID
				)
			);

			returnPage(array(
				'success' 	=> true,
			));

		break;

		//! DEFAULT
		default:

			returnPage(array(
				'errorCode' => 401,
				'errorDetail' => "No Action",
			));

		break;
	}

	function returnPage($data) {

		//Check for missing stuff. Add default values
		$data['success'] = (isset($data['success'])) ? $data['success'] : false;
		$data['errorCode'] = (isset($data['errorCode'])) ? $data['errorCode'] : 200;
		$data['errorDetail'] = (isset($data['errorDetail'])) ? $data['errorDetail'] : "";
		$data['data'] = (isset($data['data'])) ? $data['data'] : array();

		//Retourne
		echo json_encode($data);
		exit;
	}
?>