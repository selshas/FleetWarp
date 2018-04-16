<?php
/*

//  Example  //

$fu = new FileUploader("/var/www/html/");
$fu->allowEXTs("txt");
//$fu->denyEXTs("csv");
if ($files = $fu->upload()) {
	//some codes
}

*/

class FileUploader {
	
	static private $destination;
	static public $allowedEXTs = null;
	static public $deniedEXTs = null;
	static public $func_namingRule = null;
	static public $num_files = 0;
	static public $tmp_names = array();
	static public $filenames = array();

	static function setDestination($destination) {
		self::$destination = $destination;
		if (substr($destination, -1) != '/') {
			$destination .= '/';
		}
		self::$func_namingRule = function($filename) {
			return $filename;
		};
		$f = self::$func_namingRule;
		foreach ($_FILES as $file) {
			if ($file["name"]) {
				array_push(self::$tmp_names, $file["tmp_name"]);
				array_push(self::$filenames, $file["name"]);
			}
			else {
				array_push(self::$tmp_names, null);
				array_push(self::$filenames, null);
			}
		}
		self::$num_files = count(self::$filenames);
	}

	static function allowEXTs(/* $arg1[, $arg2, $arg3, $arg4, ...] */) {
		if (self::$deniedEXTs) {
			echo "ERROR : FileUploader can not take alloewdEXTs with deniedEXTs in sametime."." File:".__FILE__.", Line:".__LINE__; die;
		}
		else {
			if (($num_args = func_num_args()) && ($args = func_get_args())) {
				if (($num_args == 1) && (is_array($args[0]))) {
					self::$allowedEXTs = $args[0];
				}
				else {
					self::$allowedEXTs = $args;						
				}
				foreach (self::$allowedEXTs as $key => $value) {
					self::$allowedEXTs[$key] = strtolower($value);
				}
			}
		}
	}
	static function denyEXTs(/* $arg1[, $arg2, $arg3, $arg4, ...] */) {
		if (self::$deniedEXTs) {
			echo "ERROR : FileUploader can not take deniedEXTs with alloewdEXTs in sametime."." File:".__FILE__.", Line:".__LINE__; die;
		}
		else {
			if (($num_args = func_num_args()) && ($args = func_get_args())) {
				if (($num_args == 1) && (is_array($args[0]))) {
					self::$deniedEXTs = $args[0];
				}
				else {
					self::$deniedEXTs = $args;						
				}
				foreach (self::$deniedEXTs as $key => $value) {
					self::$deniedEXTs[$key] = strtolower($value);
				}
			}
		}
	}

	static function validateEXT($filename) {
		if (preg_match("/[^\\.]*$/", $filename, $matches)) {
			$ext = strtolower($matches[0]);
			if (self::$allowedEXTs) {
				if (array_search($ext, self::$allowedEXTs) !== false) {
					return true;
				}
			}
			else if (self::$deniedEXTs) {
				if (array_search($ext, self::$deniedEXTs) === false) {
					return true;				
				}
			}
			else {
				return true;
			}
		}
		return false;
	}

	static function upload() {
		$naming_rule = self::$func_namingRule;
		$transferringQueue = array();
		foreach ($_FILES as $file) {
			if ($file["name"]) {
				if (self::validateEXT($file["name"])) {
					array_push($transferringQueue, array($file["tmp_name"], self::$destination.$naming_rule($file["name"])));
				}
				else {
					return false;
				}
			}
			else {
				array_push($transferringQueue, null);
			}
		}
		foreach ($transferringQueue as $file) {
			if ($file) {
				move_uploaded_file($file[0], $_SERVER['DOCUMENT_ROOT'].$file[1]);			
			}
		}
		return $transferringQueue;
	}
}

?>