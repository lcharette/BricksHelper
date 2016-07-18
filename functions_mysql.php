<?php
require_once ('config.mysql.php');

class MySQL {

	protected $DBConn;
	var $DBprfx;
	protected $DBhost;
	protected $DBuser;
	protected $DBpass;
	protected $DBName;

	/**
	 * __construct function.
	 * au lancement de MySQL, on envoie prefix dans la var
	 *
	 * @access public
	 * @param bool $thisDBprfx (default: false)
	 * @param bool $thisDBhost (default: false)
	 * @param bool $thisDBuser (default: false)
	 * @param bool $thisDBpass (default: false)
	 * @param bool $thisDBName (default: false)
	 * @return void
	 */
	function __construct($thisDBprfx = false, $thisDBhost = false, $thisDBuser = false, $thisDBpass = false, $thisDBName = false) {
		global $DBhost,$DBuser,$DBpass,$DBName,$DBprfx;
		if (!$thisDBprfx) { $this->DBprfx = $DBprfx; } else { $this->DBprfx = $thisDBprfx; }
		if (!$thisDBhost) { $this->DBhost = $DBhost; } else { $this->DBhost = $thisDBhost; }
		if (!$thisDBuser) { $this->DBuser = $DBuser; } else { $this->DBuser = $thisDBuser; }
		if (!$thisDBpass) { $this->DBpass = $DBpass; } else { $this->DBpass = $thisDBpass; }
		if (!$thisDBName) { $this->DBName = $DBName; } else { $this->DBName = $thisDBName; }
	}

	/**
	 * mySQL_connect function.
	 *
	 * @access private
	 * @return void
	 */
	private function mySQL_connect() {
		$this->DBConn = mysqli_connect($this->DBhost,$this->DBuser,$this->DBpass) or die($this->mySQL_error(mysqli_error()));
		mysqli_select_db($this->DBConn, $this->DBName) or die($this->mySQL_error(mysqli_error()));
	}

	/**
	 * mySQL_deconnect function.
	 *
	 * @access private
	 * @return void
	 */
	private function mySQL_deconnect() {
		mysqli_close($this->DBConn);
	}

	/**
	 * mySQL_error function.
	 *
	 * @access private
	 * @param mixed $error
	 * @return void
	 */
	private function mySQL_error($error) {
		global $IN_SCRIPT;
		if ($IN_SCRIPT) {
			@header('MYSQL_ERROR: 1');
			@header("MYSQL_ERROR_TXT: ".$error);
			exit;
		} else {
			echo "MYSQL GLOBAL ERROR: ".$error;
			exit;
		}
	}

	/**
	 * query function.
	 *
	 * @access public
	 * @param mixed $sql
	 * @return void
	 */
	function query($sql) {
		$this->mySQL_connect();
		$query = mysqli_query($this->DBConn, $sql) or die($this->mySQL_error(mysqli_error()." (SQL: \"".$sql."\")"));

		$ligne = array();
		while ($array = mysqli_fetch_assoc($query)) {
			$ligne[] = $array;
		}

		$this->mySQL_deconnect();
		return $ligne;
	}

	/**
	 * rawQuery function.
	 *
	 * @access public
	 * @param mixed $sql
	 * @return void
	 */
	function rawQuery($sql) {
		$this->mySQL_connect();
		$query = mysqli_query($this->DBConn, $sql) or die($this->mySQL_error(mysqli_error()." (SQL: \"".$sql."\")"));
		$this->mySQL_deconnect();
		return true;
	}

	/**
	 * count function.
	 *
	 * @access public
	 * @param mixed $table
	 * @param bool $where (default: false)
	 * @return void
	 */
	function count($table, $where = false) {
		$this->mySQL_connect();
		$sql = 'SELECT count(*) as num FROM ' . $this->DBprfx . $table;

		if ($where != false) {
			$sql .= " WHERE ";
			foreach($where as $key=>$item) {
				$key = explode(" ",$key);
				if (count($key) == 2) { $dkey = $key[0]." `".$key[1]."`"; } else { $dkey = "`".$key[0]."`"; }
				$sql .= $dkey."='".$item."' ";
			}
		}
		$query = mysqli_query($this->DBConn, $sql) or die($this->mySQL_error(mysqli_error()." (SQL: \"".$sql."\")"));
		$num = mysqli_fetch_array($query);
		return $num[num];
	}

	/**
	 * select function.
	 *
	 * @access public
	 * @param mixed $table
	 * @param string $what (default: "*")
	 * @param bool $where (default: false)
	 * @param bool $order (default: false)
	 * @param bool $limit (default: false)
	 * @return void
	 */
	function select_one($table, $what = "*", $where = false, $order = false) {

		$this->mySQL_connect();
		$sql = 'SELECT '.$what.' FROM ' . $this->DBprfx . $table;
		//on trouve les qheres, fait une string avec
		if ($where != false and is_array($where)) {
			$sql .= " WHERE ";
			foreach($where as $key=>$item) {
				$key = explode(" ",$key);
				if (count($key) == 2) { $dkey = $key[0]." `".$key[1]."`"; } else { $dkey = "`".$key[0]."`"; }
				$sql .= $dkey."='".$item."' ";
			}
		}

		if ($order != false and is_array($order)) {
			$sql .= " ORDER BY ";
			foreach($order as $key=>$item) {
				$sql .= "`".$key."` ".$item;
			}
		}

		$query = mysqli_query($this->DBConn, $sql) or die($this->mySQL_error(mysqli_error()." (SQL: \"".$sql."\")"));

		$ligne = mysqli_fetch_assoc($query);
		$this->mySQL_deconnect();
		return $ligne;
	}

	/**
	 * multi_select function.
	 *
	 * @access public
	 * @param mixed $table
	 * @param string $what (default: "*")
	 * @param bool $where (default: false)
	 * @param bool $order (default: false)
	 * @param bool $limit (default: false)
	 * @return void
	 */
	function select($table, $what = "*", $where = false, $order = false, $limit = false) {

		$this->mySQL_connect();
		$sql = 'SELECT '.$what.' FROM ' . $this->DBprfx . $table;
		//on trouve les qheres, fait une string avec
		if ($where != false and is_array($where)) {
			$sql .= " WHERE ";
			foreach($where as $key=>$item) {
				$key = explode(" ",$key);
				if (count($key) == 2) { $dkey = $key[0]." `".$key[1]."`"; } else { $dkey = "`".$key[0]."`"; }
				$sql .= $dkey."='".$item."' ";
			}
		}

		if ($order != false and is_array($order)) {
			$sql .= " ORDER BY ";
			foreach($order as $key=>$item) {
				$sql .= "`".$key."` ".$item;
			}
		}

		if ($limit != false) {
			$sql .= " LIMIT ".$limit;
		}

		$query = mysqli_query($this->DBConn, $sql) or die($this->mySQL_error(mysqli_error()." (SQL: \"".$sql."\")"));

		$ligne = array();
		while ($array = mysqli_fetch_assoc($query)) {
			$ligne[] = $array;
		}

		$this->mySQL_deconnect();
		return $ligne;
	}

	/**
	 * insert function.
	 *
	 * @access public
	 * @param mixed $table
	 * @param string $data (default: "")
	 * @return void
	 */
	function insert($table, $data = "") {

		global $lang;
		if ($table == "" or $data == "") {
			$this->mySQL_error($lang->lang['ERROR_MYSQL_EMPTYREQUEST']);
			exit;
		}

		$this->mySQL_connect();
		$sql = "INSERT INTO " . $this->DBprfx . $table." (";

		//on trouve les data, fait une string avec
		$first = true;
		foreach($data as $key=>$item) {
			if (!$first) { $sql .= ","; }
			$first = false;
			$sql .= "`".$key."`";
		}

		$sql .= ") VALUES (";

		$first = true;
		foreach($data as $key=>$item) {
			if (!$first) { $sql .= ","; }
			$first = false;
			$sql .= "'".$item."'";
		}

		$sql .= ")";

		$insert = mysqli_query($this->DBConn, $sql) or die($this->mySQL_error(mysqli_error()." (SQL: \"".$sql."\")"));
		$returnedID = mysqli_insert_id();
		$this->mySQL_deconnect();

		return $returnedID;
	}

	/**
	 * update function.
	 *
	 * @access public
	 * @param mixed $table
	 * @param string $data (default: "")
	 * @param bool $where (default: false)
	 * @return void
	 */
	function update($table, $data = "", $where = false) {

		global $lang;
		if ($table == "" or $data == "") {
			$this->mySQL_error($lang->lang['ERROR_MYSQL_EMPTYREQUEST']);
			exit;
		}

		$this->mySQL_connect();
		$sql = "UPDATE " . $this->DBprfx . $table." SET ";

		//on trouve les data, fait une string avec
		$first = true;
		foreach($data as $key=>$item) {
			if (!$first) { $sql .= ","; }
			$first = false;
			$sql .= "`".$key."`='".$item."'";
		}

		//on trouve les qheres, fait une string avec
		if ($where) {
			$sql .= " WHERE ";
			foreach($where as $key=>$item) {
				$sql .= $key."='".$item."'";
			}
		}

		$update = mysqli_query($this->DBConn, $sql) or die($this->mySQL_error(mysqli_error()." (SQL: \"".$sql."\")"));
		$this->mySQL_deconnect();
		return true;
	}

	/**
	 * delete function.
	 *
	 * @access public
	 * @param mixed $table
	 * @param bool $where (default: false)
	 * @return void
	 */
	function delete($table,$where = false) {
		global $lang;
		if ($table == "") {
			$this->mySQL_error($lang->lang['ERROR_MYSQL_EMPTYREQUEST']);
			exit;
		}

		$this->mySQL_connect();
		$sql = "DELETE FROM " . $this->DBprfx . $table;

		//on trouve les wheres, fait une string avec
		if ($where != false and is_array($where)) {
			$sql .= " WHERE ";
			foreach($where as $key=>$item) {
				$key = explode(" ",$key);
				if (count($key) == 2) { $dkey = $key[0]." `".$key[1]."`"; } else { $dkey = "`".$key[0]."`"; }
				$sql .= $dkey."='".$item."' ";
			}
		}

		$delete = mysqli_query($this->DBConn, $sql) or die($this->mySQL_error(mysqli_error()." (SQL: \"".$sql."\")"));
		$this->mySQL_deconnect();
		return true;
	}
}

?>