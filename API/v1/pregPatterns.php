<?php

class Preg {
	const email = "/[\w\.]*@\w*\.\w{2,3}(\.\w{2,3})?/i";
	const phone = "/\d{3}-\d{3,4}-\d{4}/";
	const singleNumber = "/\d/";
	const password = "/([a-zA-z]+[0-9]+|[0-9]+[a-zA-z]+)[0-9a-zA-z]*/";
	const numberOnly = "/^(?!0)\d+/";
}

?>