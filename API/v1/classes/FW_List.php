<?php

class FW_List {
	
	public $length = 0;
	public $data = array();

	function add($value) {
		$this->length++;
		array_push($this->data, $value);
	}
	function insert($index, $value) {
		$this->length++;
		array_splice($this->data, $index, 0, $value);
	}

	function remove($index) {
		$this->length--;
		 array_splice($this->data, $index, 1);
	}

	function get($index){
		return $this->data[$index];
	}

	function clear() {
		$this->data = array();
		$this->length = 0;
	}

}

?>