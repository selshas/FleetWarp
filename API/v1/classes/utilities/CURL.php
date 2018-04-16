<?php
/*

	CURL::construct($host);
	CURL::setParams($array_params);
	CURL::addParam($paramName, $value);
	CURL::addParams($array_params);
	CURL::get($url, $callback);
	CURL::post($url, $callback);
	CURL::put($url, $callback);
	CURL::delete($url, $callback);

*/
class CURL {
	private $url;
	public $path_api = "";
	private $host = "";
	private $params = array();
	public $code = "000";

	function __construct(/* $host */) {

		//cuntructor must have only one argument.
		if(func_num_args() > 1) {
			throw new exception("CURL::__construct() must have one or no argument.");
		}

		//if argument host is false(blank or null), set it localhost
		if (!$host = func_get_arg(0)) {
			$host = "localhost";
		}

		//remove last '/' character from host value.
		if (preg_match("/\/$/", $host)) {
			$host = substr($host, 0, -1);
		}

		//if argument host does not start with "http://", attach it.
		if (!preg_match("/^http:\/\//", $host)) {
			$this->host = "http://".$host;
		}
		else {
			$this->host = $host;		
		}
	}

	//requiest GET method.
	function get(/* $url, $function*/) {
		$num_args = func_num_args();
		if(0 < $num_args) {
			$url = func_get_arg(0);

			if ($num_args == 2) {
				$function = func_get_arg(1);
			}
			elseif (2 < $num_args) {
				throw new exception("CURL::get() requires two argument.");
			}
		}
		else {
			throw new exception("CURL::get() requires one argument at least.");
		}

		$url = $this->host.$this->path_api.$url;
		$query = http_build_query($this->params);
		if ($query) {
			$url .= "?".$query;
		}

		$ch = curl_init($url);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
		$return = strstr(curl_exec($ch), "{");
		$this->code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
		curl_close($ch);
		if ($function) {
			return $function(json_decode($return));
		}
		else {
			return json_decode($return);
		}
	}

	//request POST method.
	function post(/* $url, $function*/) {
		$num_args = func_num_args();
		if(0 < $num_args) {
			$url = func_get_arg(0);

			if ($num_args == 2) {
				$function = func_get_arg(1);
			}
			elseif (2 < $num_args) {
				throw new exception("CURL::post() requires two argument.");
			}
		}
		else {
			throw new exception("CURL::post() requires one argument at least.");
		}

		$url = $this->host.$this->path_api.$url;
		$query = $this->params;

		$ch = curl_init($url);
		curl_setopt($ch, CURLOPT_POST, 1);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
		curl_setopt($ch, CURLOPT_POSTFIELDS, $query);
		$return = strstr(curl_exec($ch), "{");
		$this->code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
		curl_close($ch);
		if ($function) {
			return $function(json_decode($return));
		}
		else {
			return json_decode($return);
		}
	}

	//request PUT method.
	function put(/* $url, $function*/) {
		$num_args = func_num_args();
		if(0 < $num_args) {
			$url = func_get_arg(0);

			if ($num_args == 2) {
				$function = func_get_arg(1);
			}
			elseif (2 < $num_args) {
				throw new exception("CURL::put() requires two argument.");
			}
		}
		else {
			throw new exception("CURL::put() requires one argument at least.");
		}

		$url = $this->host.$this->path_api.$url;
		$query = http_build_query($this->params);

		$ch = curl_init($url);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
		curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "PUT");
		curl_setopt($ch, CURLOPT_POSTFIELDS, $query);
		$return = strstr(curl_exec($ch), "{");
		$this->code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
		curl_close($ch);
		if ($function) {
			return $function(json_decode($return));
		}
		else {
			return json_decode($return);
		}
	}

	//request DELETE method.
	function delete(/* $url, $function*/) {
		$num_args = func_num_args();
		if(0 < $num_args) {
			$url = func_get_arg(0);

			if ($num_args == 2) {
				$function = func_get_arg(1);
			}
			elseif (2 < $num_args) {
				throw new exception("CURL::delete() requires two argument.");
			}
		}
		else {
			throw new exception("CURL::delete() requires one argument at least.");
		}

		$url = $this->host.$this->path_api.$url;
		$query = http_build_query($this->params);

		$ch = curl_init($url);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
		curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "DELETE");
		curl_setopt($ch, CURLOPT_POSTFIELDS, $query);
		$return = strstr(curl_exec($ch), "{");
		$this->code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
		curl_close($ch);
		if ($function) {
			return $function(json_decode($return));
		}
		else {
			return json_decode($return);
		}
	}

	//set Parameters
	function setParams($array_params) {
		if (is_array($array_params)) {
			$this->params = $array_params;
			return true;
		}
		else {
			throw new exception("ERROR : CURL::setParams() must have one argument as an array."." File:".__FILE__.", Line:".__LINE__);
			return false;
		}
	}
	function addParams($array_params) {
		if (is_array($array_params)) {
			$this->params = array_merge($this->params, $array_params);
			return true;
		}
		else {
			throw new exception("ERROR : CURL::addParams() must have one argument as an array."." File:".__FILE__.", Line:".__LINE__);
			return false;
		}
	}
	function addParam($paramName, $value) {
		if (!is_string($paramName)) {
			throw new exception("ERROR : the first argument of CURL::addParam() must be a string."." File:".__FILE__.", Line:".__LINE__);
			return false;
		}
		if (is_callable($value) || is_array($value) || is_object($value)) {
			throw new exception("ERROR : the second argument of CURL::addParam() must be a proper value."." File:".__FILE__.", Line:".__LINE__);
			return false;
		}
		$this->params = array_merge($this->params, array($paramName => $value));
		return true;
	}
}

//get file parameter data forms for curl transfer.
function getCURLFiles(){
	$curlfiles = array();
	foreach($_FILES as $key => $file) {
		$curlfiles[$key] = new CURLFile($file["tmp_name"],$file["type"],$file["name"]);
	}
	return $curlfiles;
}

?>