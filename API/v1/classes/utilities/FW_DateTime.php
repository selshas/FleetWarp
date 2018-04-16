<?php

/*

	FW_DateTime::isLeapYear();
	FW_DateTime::getMaxDay();
	FW_DateTime::refresh();
	FW_DateTime::toString();
	FW_DateTime::compareOf();

*/

class FW_DateTime {

	public $isDateTime = true;

	private $years;
	private $months;
	private $days;

	private $hours;
	private $minutes;
	private $seconds;

	public $date;

	function __construct() {
		if ((func_num_args() && $string_datetime = func_get_arg(0)) && preg_match("/^\d{4}-\d{1,2}-\d{1,2}( \d{2}:\d{1,2}:\d{2})?$/", $string_datetime)) {
			$this->date = $string_datetime;
		}
		else {
			//get TimeStamp
			$this->date = date("Y-m-d H:i:s");
		}
		$dateTime = explode(" ", $this->date);
		$dateTime[0] = explode("-", $dateTime[0]);
		$dateTime[1] = explode(":", $dateTime[1]);

		$this->years = $dateTime[0][0];
		$this->months = $dateTime[0][1];
		$this->days = $dateTime[0][2];
		
		$this->hours = $dateTime[1][0];
		$this->minutes = $dateTime[1][1];
		$this->seconds = $dateTime[1][2];
	}

	function isLeapYear() {
		return (((($this->years % 4) == 0) && (($this->years % 100) != 0)) || (($this->years % 400) == 0));
	}
	function getMaxDay() {
		$maxDay = 30;
		switch ($this->months) {
			case 1 : 
			case 3 : 
			case 5 : 
			case 7 : 
			case 8 : 
			case 10 : 
			case 12 : {
				$maxDay++;
				break;
			}
			case 2 : {
				$maxDay--;
				if (!$this->isLeapYear()) {
					$maxDay--;
				}
				break;
			}
		}
		return $maxDay;
	}

	function refresh() {
		if ($this->isDateTime) {
			if ($this->seconds >= 60) {
				$this->minutes += floor($this->seconds/60);
				$this->seconds = $this->seconds%60;
			}
			if ($this->minutes >= 60) {
				$this->hours += floor($this->minutes/60);
				$this->minutes = $this->minutes%60;
			}
			if ($this->hours >= 24) {
				$this->days += floor($this->hours/24);
				$this->hours = $this->hours%24;
			}
		}
		$maxDay = $this->getMaxDay();
		do {
			if ($this->days > $maxDay) {
				$this->months++;
				$this->days -= $maxDay;
				$maxDay = $this->getMaxDay();
			}
			if ($this->months > 12) {
				$this->years++;
				$this->months = $this->months%12;
			}
		} while(($this->days > $maxDay) || ($this->month > 12));
		$this->date = $this->toString();
	}

	function toString() {
		return $this->years."-".$this->months."-".$this->days." ".$this->hours.":".$this->minutes.":".$this->seconds;
	}

	function compareOf($dateTime) {
		if (is_string($dateTime)) {
			$dateTime = new FW_DateTime($dateTime);
		}
		if ((is_object($dateTime)) && ($dateTime instanceof FW_DateTime)) {
			if ($this->years > $dateTime->years) {
				return 1;
			}
			else if ($this->years < $dateTime->years) {
				return -1;
			}
			else {
				if ($this->months > $dateTime->months) {
					return 1;
				}
				else if($this->months < $dateTime->months) {
					return -1;
				}
				else {
					if ($this->days > $dateTime->days) {
						return 1;
					}
					else if($this->days < $dateTime->days) {
						return -1;
					}
					else {
						if ($this->isDateTime) {
							if ($this->hours > $dateTime->hours) {
								return 1;
							}
							else if ($this->hours < $dateTime->hours) {
								return -1;
							}
							else {
								if ($this->minutes > $dateTime->minutes) {
									return 1;
								}
								else if ($this->minutes < $dateTime->minutes) {
									return -1;
								}
								else {
									if ($this->seconds > $dateTime->seconds) {
										return 1;
									}
									else if ($this->seconds < $dateTime->seconds) {
										return -1;
									}								
								}								
							}
						}
					}
				}
				return 0;
			}
		}
	}

	function __set($propName, $value) {
		if(property_exists($this, $propName)) {
			$this->$propName = $value;
			$this->refresh();
		}
	}

	function __get($propName) {
		if(property_exists($this, $propName)) {
			return $this->$propName;
		}
	}
}

?>