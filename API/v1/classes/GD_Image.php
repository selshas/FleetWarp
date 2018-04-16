<?php

class GD_Image {

	private $imageHandler = null;
	public $contentType = "";
	public $width = 0;
	public $height = 0;

	function __construct($filepath) {
		$this->contentType = mime_content_type($filepath);

		if (preg_match("/^image\/\w+/", $this->contentType)) {
			switch($this->contentType) {
				case "image/png" : {
					$this->imageHandler = imagecreatefrompng($filepath);
					break;
				}
				case "image/jpeg" : {
					$this->imageHandler = imagecreatefromjpeg($filepath);
					break;
				}
				default : {
					echo "ERROR : ",$this->contentType," is not supported.";
				}
			}
			$this->width = imagesx($this->imageHandler);
			$this->height = imagesy($this->imageHandler);
		}
		else {
			echo "ERROR : gd_image::__construct($filepath). The Argument $filepath must be a image/* type.";
		}
	}

	function saveAt($targetPath, $filename, $autoFormatString = true) {
		$imageURL = "";
		switch($this->contentType) {
			case "image/png" : {
				imagealphablending($this->imageHandler, false);
				imagesavealpha($this->imageHandler, true);

				$imageURL = $targetPath."/".$filename.($autoFormatString?".png":"");
				imagepng($this->imageHandler, $_SERVER["DOCUMENT_ROOT"].$imageURL);
				break;
			}
			case "image/jpeg" : {
				$imageURL = $targetPath."/".$filename.($autoFormatString?".jpg":"");
				imagejpeg($this->imageHandler, $_SERVER["DOCUMENT_ROOT"].$imageURL);
				break;
			}
			default : {
				echo "ERROR : ",$this->contentType," is not supported.";
			}
		}
		return $imageURL;
	}

	function resize($width, $height) {
		$newImageHandler = imagecreatetruecolor($width, $height);
		imagefill($newImageHandler, 0,0, imagecolorallocatealpha($newImageHandler, 0, 0, 0, 127));
		imagecopyresized($newImageHandler, $this->imageHandler, 0, 0, 0, 0, $width, $height, $this->width, $this->height);
		imagedestroy($this->imageHandler);
		$this->imageHandler = $newImageHandler;
		$this->width = $width;
		$this->height = $height;
	}

	function crop($x, $y, $width, $height) {
		$newImageHandler = imagecreatetruecolor($width, $height);
		imagefill($newImageHandler, 0,0, imagecolorallocatealpha($newImageHandler, 0, 0, 0, 127));

		imagealphablending($newImageHandler, true);
		imagecopy($newImageHandler, $this->imageHandler, 0, 0, $x, $y, $width, $height);

		imagedestroy($this->imageHandler);
		$this->imageHandler = $newImageHandler;
		$this->width = $width;
		$this->height = $height;
	}
	function squarize() {
		$size = 0;
		if ($this->width > $this->height) {
			$size = $this->width;
		}
		else if ($this->width < $this->height) {
			$size = $this->height;
		}
		else {
			return false;
		}

		$newImageHandler = imagecreatetruecolor($size, $size);
		imagefill($newImageHandler, 0,0, imagecolorallocatealpha($newImageHandler, 0, 0, 0, 127));

		imagealphablending($newImageHandler, true);
		imagecopy($newImageHandler, $this->imageHandler, ($size/2)-($this->width/2), ($size/2)-($this->height/2), 0, 0, $this->width, $this->height);

		imagedestroy($this->imageHandler);
		$this->imageHandler = $newImageHandler;
		$this->width = $size;
		$this->height = $size;
		return true;
	}
	function printout() {
		switch($this->contentType) {
			case "image/png" : {
				imagealphablending($this->imageHandler, false);
				imagesavealpha($this->imageHandler, true);
				imagepng($this->imageHandler);
				break;
			}
			case "image/jpeg" : {
				imagejpeg($this->imageHandler);
				break;
			}
			default : {
				echo "ERROR : ",$this->contentType," is not supported.";
			}
		}	
	}
}

?>