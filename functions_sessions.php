<?php

/**
 * session class.
 */
class session {

	var $user = array();


	function __construct() {

		global $config, $MySQL, $template;

		//Start Session
		session_name($config["cookie_name"]);
		session_start();

		if (isset($_SESSION["user_id"])) {

			$this->getUserDetail();

		} else {
			$this->resetUserDetail();
		}
	}

	function getUserDetail() {

		global $config, $MySQL, $template;

		//On va chercher nos informations
		$ligne = $MySQL->select_one('users','*',array('user_id'=>$_SESSION["user_id"]));

		if ($ligne != "") {
			$this->user["logged_in"] = true;
			$this->user["data"] = array(
				"user_id"	=> $_SESSION["user_id"],
				"username"	=> $ligne["username"],
			);
		} else {
			$this->logout();
		}
	}

	function resetUserDetail() {
		$this->user["logged_in"] = false;
		$this->user["data"] = array(
			"user_id"	=> -1,
			"username"	=> "Annonyme"
		);
	}

	function setup($require_login = false) {

		if ($require_login and !$this->user["logged_in"]) {
			//redirect("/login.php?redirect=" . $_SERVER["PHP_SELF"]);
			echo "require login";
		}
	}

	/**
	 * user_data_template function.
	 *
	 * @access public
	 * @return void
	 */
	function user_data_template() {
		$user_data = array(
			"LOGGED_IN"	=> $this->user["logged_in"],
			"USERNAME"	=> $this->user["data"]["username"],
			"USER_ID"	=> $this->user["data"]["user_id"]
		);
		return $user_data;
	}

	/**
	 * login function.
	 *
	 * @access public
	 * @param mixed $name
	 * @param mixed $pass
	 * @return void
	 */
	function login($email, $pass) {
		global $MySQL;

		//Var qui va contenir les erreurs
		$errors = array();

		//On va chercher les infos
		$ligne = $MySQL->select_one('users','*',array('email'=>$email));

		//on v√©rifie si le user existe
		if ($ligne != "") {

			//On v√©rifie le mot de passe
			if (crypt(md5($pass), $ligne['password']) == $ligne['password']) {

				//On ajoute dans la session
				$_SESSION['user_id'] = $ligne['user_id'];

			} else {
				$errors[] = "Le mot de passe est erroné !";
			}
		} else {
			$errors[] = "Le nom d'utilisateur est introuvable !";
		}

		return $errors;
	}

	function logout() {
		session_destroy();
		$this->resetUserDetail();
		//redirect("/");
		//exit;
	}

}

/**
 * request_var function.
 *
 * @access public
 * @param mixed $var
 * @param mixed $default
 * @param bool $cookie (default: false)
 * @return void
 */
function request_var($var_name, $default, $cookie = false) {

	if (!$cookie && isset($_COOKIE[$var_name]))
	{
		if (!isset($_GET[$var_name]) && !isset($_POST[$var_name]))
		{
			return (is_array($default)) ? array() : $default;
		}
		$_REQUEST[$var_name] = isset($_POST[$var_name]) ? $_POST[$var_name] : $_GET[$var_name];
	}

	$super_global = ($cookie) ? '_COOKIE' : '_REQUEST';
	if (!isset($GLOBALS[$super_global][$var_name]) || is_array($GLOBALS[$super_global][$var_name]) != is_array($default))
	{
		return (is_array($default)) ? array() : $default;
	} else {
		return $GLOBALS[$super_global][$var_name];
	}
}

function LEGO_Cache_Data($data) {

	global $MySQL;

	//Decode as an associative array
	$data_json = json_decode($data, true);

	//We store the data in the Cache Database
	foreach ($data_json['Bricks'] as $i => $brickValue) {

		$MySQL->rawQuery("INSERT INTO " . $MySQL->DBprfx . "elementCache (
			`elementID`, `designID`, `ColourDescr`, `ItemDescr`, `cachedOn`, `Asset`
		) VALUES (
			".$brickValue['ItemNo'].",
			".$brickValue['DesignId'].",
			'".addslashes($brickValue['ColourDescr'])."',
			'".addslashes($brickValue['ItemDescr'])."',
			".time().",
			'".$brickValue['Asset']."'
		) ON DUPLICATE KEY UPDATE `designID`=".$brickValue['DesignId'].", `ColourDescr`='".addslashes($brickValue['ColourDescr'])."', `ItemDescr`='".addslashes($brickValue['ItemDescr'])."', `cachedOn`=".time().", `Asset`='".$brickValue['Asset']."'");
	}
}

?>