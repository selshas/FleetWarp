<?php

	class URI {	

		public $URI;
		public $arguments = null;

		public $post = null;
		public $put = null;
		public $get = null;
		public $delete = null;

		function __construct($URI) {
			foreach (Core::$list_resources as $resource) {
				if ($resource->URI == $URI) {
					echo "ERROR : '",$URI,"' is already exist."." File:".__FILE__.", Line:".__LINE__;
					die;
				}
			}
			$this->URI = $URI;
			array_push(Core::$list_resources, $this);
		}
	}

?>