<?php
	//custom codes would be started from here.

	//dateTime
	$resource_document_dateTime = new URI("/dateTime");
	$resource_document_dateTime->get = new HTTPMethod(function() {
		$dateTime = new FW_DateTime();
		return Response::success(null, $dateTime);
	});

	$res_doc_host = new URI("/serverHost");
	$res_doc_host->get = new HTTPMethod(function() {
		return Response::success(null, $_SERVER["SERVER_NAME"]);
	});

	//test api
	$resource_document_test = new URI("/test");
	$resource_document_test->get = new HTTPMethod(function() {
		return Response::success("Found!", $_REQUEST);
	});
	$resource_document_test->post = new HTTPMethod(function() {
		return Response::created("Created!", uploadFiles());
	});
	$resource_document_test->put = new HTTPMethod(function() {
		return Response::success("PUT Success", $_REQUEST);
	});
	$resource_document_test->delete = new HTTPMethod(function() {
		return Response::success("DELETE Success", $_REQUEST);
	});

	//////////////////////////////////////////////////////////////////////////////////////////

	//	Custom API code below

	//////////////////////////////////////////////////////////////////////////////////////////
?>