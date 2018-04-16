<?php

class CSVLoader {

	private $pointer_currentRow = 0	;
	public $num_rows = 0;

	public $data;
	private $ignoreFirstLine = true;
	private $isFirstLineKey = true;

	function __construct(/* $path_csvFile[, $ignoreFirstLine] */) {
		$args = func_get_args();
		$path_csvFile = $args[0];

		switch (func_num_args()) {
			case 2 : {
				//if the count of arguments is 2, there would be second argument '$ignoreFirstLine' is exist.
				if (is_bool($args[1])) {
					$this->ignoreFirstLine = $args[1];
				}
				else {
					echo "ERROR : CSVLoader::__construct()'s second argument must be boolean."." File:".__FILE__.", Line:".__LINE__;
					die;
				}
			}
			case 1 : {
				$fetchedData = array();
				$fp = fopen($path_csvFile, "r");
				if ($this->ignoreFirstLine) {
					fgetcsv($fp);
				}
				while ($row = fgetcsv($fp)) {
					array_push($fetchedData, $row);
				}
				$this->num_rows = count($fetchedData);
				$this->data = $fetchedData;
				break;
			}
			default : {
				//constructor must have one argument at least.
				echo "ERROR : CSVLoader::__construct() requires at least one argument."." File:".__FILE__.", Line:".__LINE__;
				die;
			}
		}
	}

	//get datas from current row, and move pointer to the next.
	function getRow() {
		$row = $this->data[$this->pointer_currentRow];
		$this->pointer_currentRow++;
		return $row;
	}

}

?>