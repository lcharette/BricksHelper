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
					'msg' => "Missing param",
				));
			}

			//Check if the two password are the same
			if ($pass1 != $pass2) {
				returnPage(array(
					'errorCode' => 403,
					'msg' => "Pass mismatch param",
				));
			}

			//check if email already registered
			$ligne = $MySQL->select_one('users', '*', array('email' => $email));

			if (isset($ligne) && !empty($ligne)) {
				returnPage(array(
					'errorCode' => 404,
					'msg' => "Email already registered",
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
		case 'login':

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
					'msg' => implode("; ", $reponse),
				));

			}

		break;

		case 'List':

			//Check if we are logged in
			if (!$session->user['logged_in']) {

				returnPage(array(
					'errorCode' => 406,
					'msg' => "Not logged in",
				));

			} else {

				//We get user lists
				$results = $MySQL->select("userlists", "*", array("user_id" => $session->user['data']['user_id']), array("createdOn" => "ASC"));

				//Return everything
				returnPage(array(
					'success' 	=> true,
					'data'	=> array(
						'userdata' => $session->user['data'],
						'userlists' => $results
					)
				));
			}

		break;

		case 'logout':

			$session->logout();

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