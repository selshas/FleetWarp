<?php

	class ResourceAutoLoader {
		static function loadResources() {
			$files = scandir("./resources");
			foreach($files as $i=>$filename) {
				if (preg_match("/^.+\.php$/", $filename)) {
					include "./resources/".$filename;
				}
			}
		}
	}

?>