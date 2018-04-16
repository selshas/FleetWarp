<?php

class MySQL_Account {
	public $host = null;
	public $user = null;
	public $password = null;
	public $db = null;

	private $arguments = array();

	function __construct() {
		$num_args = func_num_args();
		if ($num_args) {
			$arguments = func_get_args();
			switch ($num_args) {
				case 4 : { 
					$this->db = $arguments[3];
				}
				case 3 : {
					$this->host = $arguments[0];
					$this->user = $arguments[1];
					$this->password = $arguments[2];
					break;
				}
				default : {
					echo "Error : Host and Account Information are required."." File:".__FILE__.", Line:".__LINE__;
					die;
				}
			}
		}
	}

	function useDB($dbname) {
		if ($dbname) {
			$this->db = $dbname;
		}
		else {
			echo "Error : Database name is required."." File:".__FILE__.", Line:".__LINE__;
			die;
		}
	}

	public function connect($function) {
		$mysqli = new mysqli($this->host, $this->user, $this->password, $this->db);

			$arguments = $this->arguments;
			array_unshift($arguments, $mysqli);
			$return = call_user_func_array($function, $arguments);

		$mysqli->close();
		$this->arguments = array();

		return $return;
	}

	public function sendArgs() {
		//passing arguments from outside of instance.
		$this->arguments = func_get_args();
	}
}

?>