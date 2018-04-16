<?php
	class HTTPMethod {

		public $allowedParams = null;	//allowed parameters is specifying what you can pass. you can not pass other parameters which is not in this array.
		public $requiredParams = null;	//required parameter is specifying what you have to include at queries. you would get bad request except there parameters.
		public $function = null;

		function __construct($function) {
			$this->function = $function;
		}
		function allowParams(/* $paramName1[, $paramName2, $paramName3...] */) {
			$args = func_get_args();
			if (func_num_args() == 1 && is_array($args[0])) {
				$this->allowedParams = $args[0];			
			}
			else {
				$this->allowedParams = $args;
			}
		}
		function requireParams(/* $paramName1[, $paramName2, $paramName3...] */) {
			$args = func_get_args();
			if (func_num_args() == 1 && is_array($args[0])) {
				$this->requiredParams = $args[0];			
			}
			else {
				$this->requiredParams = $args;
			}
		}
		function execute(/* $params */) {
			if($this->allowedParams && count($this->allowedParams)) {
				$allowedParams = array();
				$pregs = array();
				foreach ($this->allowedParams as $key => $value) {
					if (is_string($key)) {
						$preg = $value;
						array_push($allowedParams, $key);
						$pregs[$key] = $preg;
					}
					else {
						array_push($allowedParams, $value);
						$pregs[$value] = null;
					}
					//$allowedParams contains param list which are allowed
					//$pregs contains regular expressions for allowed parameters
					
				}
				foreach($_REQUEST as $key => $value) {
					if (array_search($key, $allowedParams) === false) {
						Response::badRequest("Parameter '".$key."' is not allowed.")->respond();
						die;
					}
					if ($pregs[$key]) {
						//if the preg is null, this parameter has no validation rule.
						if (!preg_match($pregs[$key], $value)) {
							Response::badRequest("Parameter '".$key."' is not valid.")->respond();
							die;						
						}
					}
				}	
			}
			if($this->requiredParams && count($this->requiredParams)) {
				foreach($this->requiredParams as $key => $value) {
					if (is_string($key)) {
						$preg = $value;
						$value = $key;
					}
					else {
						$preg = null;
					}
					if (isset($_REQUEST[$value])) {
						if ($preg) {
							//if the preg is null, this parameter has no validation rule.
							if (!preg_match($preg, $_REQUEST[$value])) {
								Response::badRequest("Parameter '".$value."' is not valid.")->respond();
								die;
							}
						}
					}
					else {
						Response::badRequest("Parameter '".$value."' is required.")->respond();
						die;		
					}
				}				
			}
			$params = array();
			if (($num_args = func_num_args()) && ($params = func_get_args()) && ($num_args == 1) && (is_array($params[0]))) {
				$params = $params[0];
			}
			return call_user_func_array($this->function, $params);
		}

	}

?>