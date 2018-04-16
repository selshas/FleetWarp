<?php

class Core {

	public static $list_resources = array();
	public static $activeAccount = null;
	public static $sessionID = "";
	public static $requestedResource = "";
	public static $rootDirectory = "";

	//Declare a Resource
	static function uri($string_uri) {
		$uri = new URI($string_uri);
		return $uri;
	}
	//identify requested resource, and return it.
	static function identifyResource($uri) {
		$dirname_APIRoot = self::getBaseDirectoryName();

		//cut out api path from full requested URI.
		//$regexp = "/^[^".$dirname_APIRoot."]*\/".$dirname_APIRoot."/";
		$regexp = "/^[a-z\/]*\/".$dirname_APIRoot."/i";
		self::$requestedResource = preg_replace($regexp, "", $uri);

		//cut out URI query from requested URI.
		$regexp = "/\?.*/";
		self::$requestedResource = preg_replace($regexp, "", self::$requestedResource);

		$resource = null;
		foreach(self::$list_resources as $index => $resource) {
			$URI = $resource->URI;
			if (self::$requestedResource == $URI) {
				return $resource;
			}
			else {
				$resource = null;			
			}
		}
		foreach(self::$list_resources as $index => $resource) {
			$URI = $resource->URI;

			$regexp_valueMatch = preg_replace("/:([^\/]*)/", "([^\\\\\\/]*)", $URI);
			$regexp_valueMatch = "/^".str_replace("/", "\/", $regexp_valueMatch)."$/";

			if (preg_match($regexp_valueMatch, self::$requestedResource, $matches_value)) {
				array_shift($matches_value);
				$resource->arguments = $matches_value;
				break;
			}
			else {
				$resource = null;
			}
		}
		return $resource;
	}

	static function internalRequest(/* $uri, $method, $params */) {
		//validate, set arguments
		$num_args = func_num_args();
		$arguments = func_get_args();

		if ($num_args<2) {
			throw new exception("Core::internalRequest() need two arguments at least");
			return false;
		}
		elseif ($num_args > 3) {
			throw new exception("Core::internalRequest() can have three arguments maximum");
			return false;			
		}
		elseif ($num_args == 3) {
			$params =  $arguments[2];
		}
		
		$uri = $arguments[0];
		$method = $arguments[1];

		//function logic
		$curl_localhost = new CURL("localhost");
		$curl_localhost->path_api = substr($path = str_replace($_SERVER['DOCUMENT_ROOT'], "", str_replace("\\", "/", str_replace("classes", "", dirname(__FILE__)))), 0, strlen($path)-1);
		if (isset($params) || is_array($params)) {
			$curl_localhost->setParams($params);
		}

		if (!is_string($method)) {
			return Response::internal("Method Name is not a string");
		}
		$method = strtolower($method);
		$response = $curl_localhost->$method($uri);
		if ($curl_localhost->code == 204) {
			return Response::noContent();
		}
		return $response;
	}

	static function getBaseDirectoryName() {
		//Get Directory name.
		/*
			__FILE__	:	full physical path of this file
			dirname(__FILE__) : full physical path of the directory;
		*/
		return basename(str_replace("classes", "", dirname(__FILE__)));
	}
	static function initialize() {
		ResourceAutoLoader::loadResources();
		header("Content-Type: application/x-resource+json");

		$resource_requested = null;
		if ($resource_requested = self::IdentifyResource($_SERVER["REQUEST_URI"])) {
			$methodName = strtolower($_SERVER["REQUEST_METHOD"]);
			if ($methodName != "get" || $methodName != "post") {
				parse_str(file_get_contents("php://input"), $array_queryData);
				$_REQUEST = array_merge($_REQUEST, $array_queryData);
			}
			if ($HTTPMethod = $resource_requested->$methodName) {				
				//requested resource supports the method.
				try {
					$result = $HTTPMethod->execute($resource_requested->arguments);
				}
				catch(exception $e) {
					$result = Response::internal($e->getMessage());
				}
				if (is_a($result, "Response")) {
					$result->respond();
				}
				else {
					echo "Error : Requested Method must return a instance of Reponse class."." File:".__FILE__.", Line:".__LINE__; die;
				}
			}// if ($HTTPMethod = $resource_requested->$methodName)
			else {
				//405 Error. the method is not defined in this resource.
				Response::notAllowedMethod($methodName)->respond();
			}
		} //if ($resource_requested = self::IdentifyResource($_SERVER["REQUEST_URI"))
		else {
			//404 Error. requested resource is not exist in API.
			Response::notFound()->respond();
		}

	}
}
Core::$rootDirectory = str_replace(basename($_SERVER["PHP_SELF"]), "", $_SERVER["PHP_SELF"]);

session_start();
Core::$sessionID = session_id();

register_shutdown_function(function() {
	$error = error_get_last();
	if($error["type"] == E_ERROR) {
		var_dump($error);
	}
});

function jsonPrint($data) {
	echo $data?json_encode($data):"";
}

function is_array_assoc($array) {
	if (is_array($array)) {
		if (array() === $array) {
			return false;
		}
		$keys = array_keys($array);
		foreach ($keys as $key) {
			if (is_string($key)) {
				return false;
			}
		}
		return true;
	}
	else {
		return false;
	}
}
?>