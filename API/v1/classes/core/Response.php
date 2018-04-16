<?php

/*

	Response::notFound($message, $data);
	Response::unauthorized($message, $data);
	Response::badRequest($message, $data);
	Response::noContent($message, $data);
	Response::created($message, $data);
	Response::success($message, $data);
	Response::forbidden($message, $data);
	Response::notAllowedMethod($methodName, $data);

*/

class Response {

	public $responseCode;
	public $message;
	public $dataLength = 0;
	public $data;

	function __construct($responseCode, $message, $data) {
		$this->responseCode = $responseCode;
		$this->message = $message;
		$this->dataLength = $data?(is_array_assoc($data)?(($count=count($data))?$count:0):1):0;
		$this->data = $data;
	}
	function respond() {
		http_response_code($this->responseCode);
		jsonPrint($this);
	}

	static function notFound() {
		$num_args = func_num_args();
		$args = func_get_args();
		$message = $args[0]?$args[0]:"Requested Resource is not Exist.";
		$return = $num_args>1?$args[1]:null;
		return new Response("404", $message, $return);
	}
	static function unauthorized() {
		$num_args = func_num_args();
		$args = func_get_args();
		$message = $args[0]?$args[0]:"Unauthorized Access.";
		$return = $num_args>1?$args[1]:null;
		return new Response("401", $message, $return);
	}
	static function preconditionFailed() {
		$num_args = func_num_args();
		$args = func_get_args();
		$message = $args[0]?$args[0]:"Precondition Failed.";
		$return = $num_args>1?$args[1]:null;
		return new Response("412", $message, $return);
	}
	static function badRequest() {
		$num_args = func_num_args();
		$args = func_get_args();
		$message = $args[0]?$args[0]:"Bad Request.";
		$return = $num_args>1?$args[1]:null;
		return new Response("400", $message, $return);
	}
	static function noContent() {
		$num_args = func_num_args();
		$args = func_get_args();
		$message = $args[0]?$args[0]:"Request Accepted.";
		$return = $num_args>1?$args[1]:null;
		return new Response("204", $message, $return);
	}
	static function created() {
		$num_args = func_num_args();
		$args = func_get_args();
		$message = $args[0]?$args[0]:"Resource Created!";
		$return = $num_args>1?$args[1]:null;
		return new Response("201", $message, $return);	
	}
	static function success() {
		$num_args = func_num_args();
		$args = func_get_args();
		$message = $args[0]?$args[0]:"Resource Found.";
		$return = $num_args>1?$args[1]:null;
		return new Response("200", $message, $return);	
	}
	static function forbidden() {
		$num_args = func_num_args();
		$args = func_get_args();
		$message = $args[0]?$args[0]:"Forbidden";
		$return = $num_args>1?$args[1]:null;
		return new Response("403", $message, $return);	
	}
	static function notAllowedMethod() {
		$num_args = func_num_args();
		$args = func_get_args();
		$message = $args[0]?("'".strtoupper($args[0])."' is not being supported on current resource."):"Requested Resource Does not Support this Method";
		$return = $num_args>1?$args[1]:null;
		return new Response("405", $message, $return);	
	}
	static function internal() {
		$num_args = func_num_args();
		$args = func_get_args();
		$message = $args[0]?$args[0]:"Internal Error";
		$return = $num_args>1?$args[1]:null;
		return new Response("500", $message, $return);	
	}
}

?>