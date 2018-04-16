<?php

	//declare MySQLAccounts.
	$mySQL_Account_root = new MySQL_Account("localhost", "talkingBroAdmin", "TalkingBro180112", "talkingBro");

	//set default.
	Core::$activeAccount = $mySQL_Account_root;

?>