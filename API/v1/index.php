<?php
	error_reporting(E_ALL & ~E_NOTICE);
	ini_set('display_errors', 1);

	//////////////////////////////////////////////
	//											//
	//		FleetWarp API Framework				//
	//		By Ky.Yang							//
	//											//
	//////////////////////////////////////////////

	date_default_timezone_set("Asia/Seoul");

	//Framework Classes
	require_once "./classes/core/Core.php";				//API Core.

	//Utility Classes
	require_once "./classes/utilities/FW_List.php";
	require_once "./classes/utilities/FW_DateTime.php";
	require_once "./classes/utilities/CURL.php";
	require_once "./classes/utilities/MySQLAccount.php";
	require_once "./classes/utilities/MySQLUtilities.php";	//MySQL Utility Classes.
	require_once "./classes/utilities/GD_Image.php";

	//custom API codes
	require_once "./mySQLAccounts.php";				//MySQL accounts
	require_once "./pregPatterns.php";				//Constant Enumeration.
	require_once "./resources.php";					//resource declares

	//custom apllication codes
	require_once "./customs/fileUploader.php";				//fileUploader Function
	require_once "./customs/authorizations.php";				//authorization Function
	require_once "./customs/getClientIP.php";				//getClientIP Function

	//API is ready.
	Core::initialize();

?>