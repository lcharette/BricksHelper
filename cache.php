<?php

require_once("config.php");
require_once("functions_mysql.php");
require_once("functions_sessions.php");

//Prépare MySQL
$MySQL = new MySQL();

//Variables
$data = request_var("data", null);

if ($data == null) { exit; }

//Cache the data
LEGO_Cache_Data($data);

?>