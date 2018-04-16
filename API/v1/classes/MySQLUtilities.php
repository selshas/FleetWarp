<?php

/*

	MySQL_QueryFragment

	MySQL_Query
	MySQL_Tables :: FW_List
	MySQL_Table
	MySQL_Columns :: FW_List
	MySQL_Column
	MySQL_Values :: FW_List
	MySQL_Value
	MySQL_Conditions :: FW_List
	MySQL_ConditionGroup :: FW_List
	MySQL_Condition
	MySQL_Join
	MySQL_Field

*/


function removeSpecials($string) {
	$pattern = "/([`'\"\(\);])/";
	return addslashes(preg_replace($pattern, "\$1", $string));
}

define("ALL", "*");
define("COLLECTION", true);
define("DOCUMENT", false);

/*

	MySQL_Query::__construct()
	MySQL_Query::initialize()
	MySQL_Query::getSQLSubStrings()

	MySQL_Query::select()
	MySQL_Query::insert()
	MySQL_Query::update()
	MySQL_Query::delete()
	MySQL_Query::execute()

	MySQL_Query::getNumRecords()

	MySQL_Query::readySQL()
	MySQL_Query::sqlize()

*/
class MySQL_Query extends MySQL_QueryFragment {
	public $queryType = "";

	public $debug = false;

	public $tables = null;
	public $columns = null;
	public $values = null;
	public $conditions = null;
	public $limit = null;

	public $orderBy = "";
	public $groupBy = "";
	public $desc = false;

	function __construct(/* [$tableName] */) {
		if (($num_args = func_num_args()) && $args = func_get_args()) {
			$this->tables = new MySQL_Tables($args);
		}
		$this->initialize();
	}
	function initialize() {
		$this->columns = null;
		$this->columns = new MySQL_Columns();

		$this->values = null;
		$this->values = new MySQL_Values();

		$this->conditions = null;
		$this->conditions = new MySQL_Conditions();

		$this->limit = null;
		$this->limit = new MySQL_Limit();
	}

	protected function getSQLSubStrings() {
		/* var declare */
		$values = "";

		$this->params = array();

		$columns = $this->columns->sqlize();
		$this->mergeParams($columns->params);

		$tables = $this->tables->sqlize();
		$this->mergeParams($tables->params);

		switch ($this->queryType) {
			case "update" : {
				$values = $this->values->sqlize("update");
				$this->mergeParams($values->params);
				break;
			}
			case "insert" : {
				$values = $this->values->sqlize("insert");
				$this->mergeParams($values->params);
				break;
			}
		}

		if ($this->queryType != "insert") {
			$where = $this->conditions->sqlize();
			if ($where) {
				$this->mergeParams($where->params);
			}
		}
		
		$group = "";
		if ($this->groupBy) {
			$group = " group by ";
			if ($this->groupBy instanceof MySQL_Function) {
				$sqlFrag = $this->groupBy->sqlize();
				$this->mergeParams($sqlFrag->params);
				$group .= $sqlFrag->queryString;
			}
			else {
				$group .= "`".removeSpecials($this->groupBy)."`";
			}
			$group .= ($this->desc?" desc":" asc");
		}

		$order = "";
		if ($this->orderBy) {
			$order = " order by ";
			if ($this->orderBy instanceof MySQL_Function) {
				$sqlFrag = $this->orderBy->sqlize();
				$this->mergeParams($sqlFrag->params);
				$order .= $sqlFrag->queryString;
			}
			else {
				$order .= "`".removeSpecials($this->orderBy)."`";
			}
			$order .= ($this->desc?" desc":" asc");
		}

		if ($this->queryType != "insert") {
			$limit = $this->limit->sqlize();
				$this->mergeParams($limit->params);
		}

		return array("table" => is_object($tables)?$tables->queryString:"", "columns" => is_object($columns)?$columns->queryString:"", "values" => ($values?$values->queryString:""), "where" => is_object($where)?$where->queryString:"", "order" => $order, "limit" => is_object($limit)?$limit->queryString:"",);
	}
	function readySQL() {
		$queryType = strtolower($this->queryType);
		if ($queryType == "select" || $queryType == "insert" || $queryType == "delete" || $queryType == "update") {
			$sqlSubStrings = $this->getSQLSubStrings();
			switch ($queryType) {
				case "select" : {
					return $this->queryString = "select ".$sqlSubStrings["columns"]." from ".$sqlSubStrings["table"]."".($sqlSubStrings["where"]?(" where ".$sqlSubStrings["where"]):"").$sqlSubStrings["order"].$sqlSubStrings["limit"];
					break;
				}
				case "insert" : {
					return $this->queryString = "insert into ".$sqlSubStrings["table"]." ".$sqlSubStrings["values"];
					break;
				}
				case "update" : {
					return $this->queryString = "update ".$sqlSubStrings["table"]." set ".$sqlSubStrings["values"].($sqlSubStrings["where"]?(" where ".$sqlSubStrings["where"]):"").$sqlSubStrings["order"].$sqlSubStrings["limit"];
					break;
				}
				case "delete" : {
					return $this->queryString = "delete from ".$sqlSubStrings["table"]." ".($sqlSubStrings["where"]?(" where ".$sqlSubStrings["where"]):"").$sqlSubStrings["order"].$sqlSubStrings["limit"];
					break;
				}
			}
		}
		else {
			echo "ERROR : MySQL_Query::queryType must be one of 'select', 'insert', 'update', 'delete'"." File:".__FILE__.", Line:".__LINE__; die;
		}
	}
	/* SQL Execution methods */
	function select($resourceType = DOCUMENT) {
		$this->queryType = "select";
		$queryString = $this->readySQL();
		return ($num_results = count($results = $this->execute()))?((($num_results==1) && ($resourceType))?$results:($num_results > 1)?$results:$results[0]):null;
	}
	function insert() {
		$this->queryType = "insert";
		$queryString = $this->readySQL();
		return $this->execute();
	}
	function update() {
		$this->queryType = "update";
		$queryString = $this->readySQL();
		return $this->execute();
	}
	function delete() {
		$this->queryType = "delete";
		$queryString = $this->readySQL();
		return $this->execute();
	}
	function execute() {
		if ($this->debug) {
			echo $this->queryString,"\n";
			var_dump($this->params);
		}
		return Core::$activeAccount->connect(function($mysqli) {
			$query = $mysqli->prepare($this->queryString);
			if (!$query) {
				throw new exception($mysqli->error);
			}
			if (count($this->params)) {
				$params = array_merge(array(getTypeStringFromArray($this->params)), $this->params);
				call_user_func_array(array($query, "bind_param"), $params);
			}
			$result = $query->execute();
			if ($this->queryType == "select") {
				$query->store_result();
				$metadata = $query->result_metadata();
				if (!$metadata) {
					echo $query->error;
					//return new Exception($query->error);
				}
				$fieldObjects = $metadata->fetch_fields();
				$columnNames = array();
				foreach ($fieldObjects as $fieldData) {
					array_push($columnNames, $fieldData->name);
				}
				$fetchDatas = array();
				foreach($columnNames as $i => $columnName) {
					$$columnName = null;
					$fetchDatas[$i] = &$$columnName;
				}
				call_user_func_array(array($query, "bind_result"), $fetchDatas);
				$rows = array();
				while ($query->fetch()) {
					$row = array();
					foreach($columnNames as $columnName) {
						$row[$columnName] = $$columnName;
					}
					array_push($rows, $row);
				}
				return $rows;
				
			}
			return $result;
		});
	}
	function getNumRecords() {
		return Core::$activeAccount->Connect(function($mysqli) {
			$this->queryType = "select";
			$queryString = $this->readySQL();
			$queryString = "select count(*) from (".$queryString.") as `T`";
			if ($this->debug) {
				echo $queryString;
				var_dump($this->params);
			}
			$query = $mysqli->prepare($queryString);
			if (count($this->params)) {
				$params = array_merge(array(getTypeStringFromArray($this->params)), $this->params);

				call_user_func_array(array($query, "bind_param"), $params);
			}
			$query->execute();
			$query->bind_result($count);
			$query->fetch();

			return $count;
		});
	}
	function sqlize(/* [$queryType] */) {
		$queryType = null;
		if (!func_num_args() || ((func_num_args() === 1 && $queryType = strtolower(func_get_arg(0))) && ($queryType == "select" || $queryType == "insert" || $queryType == "delete" || $queryType == "update"))) {
			if (!$queryType) {
				$queryType = "select";
			}
			$this->queryType = $queryType;
			$sqlFrag = new MySQL_QueryFragment();
			$sqlFrag->queryString = $this->readySQL();
			$sqlFrag->params = $this->params;
		}
		else {
			echo "ERROR : MySQL_Query::sqlize() require an argument one of 'select', 'insert', 'update', 'delete' or none"." File:".__FILE__.", Line:".__LINE__; die;		
		}

		return $sqlFrag;
	}
}

/*
	MySQL_QueryFragment::addParam(&$value)
	MySQL_QueryFragment::mergeParams($array_newParams)
*/
class MySQL_QueryFragment {
	private $queryString = "";
	public $params = array();

	function __construct(/* [$queryString] */) {
		if (func_num_args() == 1 && $queryString = func_get_arg(0)) {
			$this->queryString = $queryString;
		}
	}

	function addParam(&$value) {
		$this->params[count($this->params)] = &$value;
	}
	function mergeParams($array_newParams) {
		if (is_array($array_newParams) && count($array_newParams)) {
			$this->params = array_merge($this->params, $array_newParams);
		}
	}

	function __set($propName, $value) {
		if (property_exists($this, $propName)) {
			switch ($propName) {
				case "queryString" : {
					$this->queryString = $value;
					if (preg_match("/^ *?select/i", $this->queryString)) {
						$this->queryType = "select";
					}
					else if (preg_match("/^ *?update/i", $this->queryString)) {
						$this->queryType = "update";
					}
					else if (preg_match("/^ *?insert/i", $this->queryString)) {
						$this->queryType = "insert";
					}
					else if (preg_match("/^ *?delete/i", $this->queryString)) {
						$this->queryType = "delete";
					}
					break;
				}
			}
		}
		return $this;
	}
	function __get($propName) {
		if (property_exists($this, $propName)) {
			switch ($propName) {
				case "queryString" : {
					return $this->queryString;
					break;
				}
			}
		}
		return null;
	}
}

class MySQL_Function {
	public $functionName;
	public $arguments = null;
	public $params = array();

	function __construct() {
		if (func_num_args() < 1) {
			throw new exception("MySQL_Function::__construct() must have 1 arguments.");
		}
		$arguments = func_get_args();
		$this->arguments = new FW_List();
		$this->functionName = array_shift($arguments);
		while ($argument = array_shift($arguments)) {
			$this->arguments->add($argument);
		}
	}
	function sqlize() {
		$queryFragment = new MySQL_QueryFragment();

		foreach ($this->arguments->data as $key => $value) {
			if (is_object($value)) {
				if ($value instanceof MySQL_Field) {
					$this->arguments->data[$key] = $value->sqlize()->queryString;
				}
				elseif ($value instanceof MySQL_Query) {
					$value->queryType = "select";
					$sqlFrag_subquery = $value->sqlize();
					$value = "(".$sqlFrag_subquery->queryString.")";
					$this->arguments->data[$key] = $value;
					$queryFragment->mergeParams($sqlFrag_subquery->params);
				}
			}
		}
		$arguments = join(", ", $this->arguments->data);
		$queryString = $this->functionName."(".$arguments.")";
		$queryFragment->queryString = $queryString;
		return $queryFragment;
	}
}
function sqlFunc(/* $functionName[, $arg1[, $arg2[, $arg3...]]] */) {
	if (func_num_args()) {
		$args = func_get_args();
		$functionName = array_shift($args);
		
		$mySQLFunction = new MySQL_Function($functionName);
		foreach ($args as $arg) {
			$mySQLFunction->arguments->add($arg);
		}
		return $mySQLFunction;
	}
	else {
		echo "ERROR : sqlFunc() needs 1 argument at least"." File:".__FILE__.", Line:".__LINE__; die;
	}
}

class MySQL_Field {
	public $table = null;
	public $name = "";

	function __construct(/* 
		$name,
		$table, $name
	*/) {
		if ($num_args = func_num_args() && $args = func_get_args()) {
			switch ($num_args) {
				case 2: {
					$this->table = $args[0];
					$this->name = $args[1];
					break;
				}
				case 1: {
					$this->name = $args[0];
					break;
				}
				default : {
					echo "ERROR : MySQL_Field::__construct() need 1 or 2 arguments."." File:".__FILE__.", Line:".__LINE__; die;
				}
			}
		}
	}
	function sqlize() {
		$table = removeSpecials($this->table);
		$field = removeSpecials($this->name);
		if ($this->table) {
			$queryString = "`".$table."`.";
		}

		if ($field == ALL ) {
			$queryString .= "*";
		}
		else {
			$queryString .= "`".$field."`";
		}

		$queryFrag = new MySQL_QueryFragment();
		$queryFrag->queryString = $queryString;
		return $queryFrag;
	}
}
function field() {
	if ($num_args = func_num_args() && $args = func_get_args()) {
		switch ($num_args) {
			case 2: {
				return new MySQL_Field($args[0], $args[1]);
				break;
			}
			case 1: {
				return new MySQL_Field($args[0]);
				break;
			}
			default : {
				echo "ERROR : field() need 0, 1, 2 arguments."." File:".__FILE__.", Line:".__LINE__; die;
			}
		}
	}
}



/* MySQL Component Classes */
/* MySQL_Table, MySQL_Tables */
class MySQL_Table {
	public $table = "";
	public $alias = "";

	function __construct(/* $table[, $alias] */) {
		$num_args = func_num_args();
		if ($num_args && $args = func_get_args()) {
			switch ($num_args) {
				case 2 : {
					$this->alias = $args[1];
				}
				case 1: {
					$this->table = $args[0];
				}
			}
		}
		else {
			$msg = "MySQL_Table::__construct() need 1 argument at least."." File:".__FILE__.", Line:".__LINE__;
			throw new exception($msg);
		}
	}
}
class MySQL_Tables extends FW_List {
	function __construct(/*$tableName1[, $tableName2[, $tableName3···.]]*/) {
		$num_args = func_num_args();
		if ($num_args && $args = func_get_args()) {
			if ($num_args == 1 && is_array($args[0])) {
				$args = $args[0];
			}
			foreach ($args as $key => $value) {
				if (is_string($key)) {
					$this->add(new MySQL_Table($value, $key));						
				}
				else {
					$this->add(new MySQL_Table($value));						
				}
			}
		}
		else {
			$msg = "MySQL_Tables::__construct() Requires 1 argument at least."." File:".__FILE__.", Line:".__LINE__;
			throw new exception($msg);
		}
	}
	function sqlize() {
		$result = new MySQL_QueryFragment();

		$tablesQuery = array();
		foreach($this->data as $table) {
			$sql_table = "";
			if (is_object($table->table)) {
				if ($table->table instanceof MySQL_Query || $table->table instanceof MySQL_Join) {
					$subQuery = $table->table;
					$subQuery = $subQuery->sqlize();
					$result->mergeParams($subQuery->params);
					$sql_table = $subQuery->queryString;
				}
			}
			elseif (is_string($table->table)) {
				$sql_table = "`".removeSpecials($table->table)."`";
			}
			
			if ($table->alias) {
				array_push($tablesQuery, "(".$sql_table.") as `".removeSpecials($table->alias)."`");
			}
			else {
				array_push($tablesQuery, $sql_table);
			}
		}
		$result->queryString = join(", ", $tablesQuery);

		return $result;
	}
}


class MySQL_Join {
	private $tableA;
	private $tableB;
	private $method = "inner";
	private $target = "";

	public $conditions = null;

	private $params = array();

	function __construct($tableA, $tableB) {
		if (is_string($tableA)) {
			$this->tableA = removeSpecials($tableA);
		}
		elseif (is_object($tableA)) {
			$this->tableA = $tableA;
		}

		if (is_string($tableB)) {
			$this->tableB = removeSpecials($tableB);
		}
		elseif (is_object($tableB)) {
			$this->tableB = $tableA;
		}

		$this->conditions = new MySQL_Conditions();
	}
	function __set($propName, $value) {
		if (property_exists($this, $propName)) {
			switch ($propName) {
				case "method": {
					$value = strtolower($value);
					if ($value == "inner" || $value == "outer") {
						$this->method = $value;					
					}
					else {
						throw new exception("MySQL_Join::$method must have a value 'inner' or 'outer'.");
					}
					break;
				}
				case "target": {
					$value = strtolower($value);
					if ($value === "" || $value == "left" || $value == "right") {
						$this->target = $value;					
					}
					else {
						throw new exception("MySQL_Join::$target must have a value 'left' or 'right'.");
					}
					break;
				}
			}
		}
		else {
			throw new exception("MySQL_Join has no property '".$propName."'");
		}
	}
	function sqlize() {
		$method = $this->method;
		$target = $this->target;

		if ($method == "inner") {
			$method = "";
		}

		$sqlFrag_result = new MySQL_QueryFragment();
		if (is_object($this->tableA)) {
			$queryFrag = $this->tableA->sqlize();
			$sqlFrag_result->queryString .= "(".$queryFrag->queryString.")";
			$sqlFrag_result->mergeParams($queryFrag->params);
		}
		else {
			$sqlFrag_result->queryString .= "`".$this->tableA."`";
		}
		$sqlFrag_result->queryString .= " ".$this->target;
		$sqlFrag_result->queryString .= " join ";
		if (is_object($this->tableB)) {
			$queryFrag = $this->tableB->sqlize();
			$sqlFrag_result->queryString .= "(".$queryFrag->queryString.")";
			$sqlFrag_result->mergeParams($queryFrag->params);		
		}
		else {
			$sqlFrag_result->queryString .= "`".$this->tableB."`";
		}

		if ($sqlFrag_conditions = $this->conditions->sqlize()) {
			$sqlFrag_result->queryString .= " on ".$sqlFrag_conditions->queryString;
			$sqlFrag_result->mergeParams($sqlFrag_conditions->params);
		}
		$sqlFrag_result->queryString = "(".$sqlFrag_result->queryString.")";

		return $sqlFrag_result;
	}
}
function tableJoin($tableA, $tableB) {
	$num_args = func_num_args();

	$tableA = removeSpecials($tableA);
	$tableB = removeSpecials($tableB);
	if ($num_args != 2) {
		throw new exception("tableJoin() requires 2 arguments.");	
		return false;
	}
	return new MySQL_Join($tableA, $tableB);
}


/* MySQL_Column, MySQL_Columns */
class MySQL_Column {
	public $field = "";
	public $alias = null;

	function __construct(/*string $field[, string $alias]*/) {
		if ($num_args = func_num_args()) {
			$args = func_get_args();
			switch (func_num_args()) {
				case 2: {
					$this->alias = $args[1];
				}
				case 1: {
					$this->field = $args[0];
					break;
				}
			}
		}
		else {
			echo "ERROR : MySQL_Column::__construct requires 1 parameter at least."." File:".__FILE__.", Line:".__LINE__;
			die;
		}
	}
}
class MySQL_Columns extends FW_List {
	function __construct(/*array $columns */) {
		if ($num_args = func_num_args()) {
			if ($num_args == 1 && is_array($columns = func_get_arg(0))) {
				foreach ($columns as $key => $value) {
					if (is_integer($key)) {
						$this->newColumn($value);					
					}
					else {
						$this->newColumn($value, $key);
					}
				}
			}
			else {
				throw new exception("MySQL_Columns::__construct() requires only 1 argument as array.");			
			}
		}
	}
	function newColumn(/* string $field[, string $alias], */) {
		$num_args = func_num_args();
		if ($num_args && $args = func_get_args()) {
			switch ($num_args) {
				case 2: {
					$this->add(new MySQL_Column($args[0], $args[1]));
					break;
				}
				case 1: {
					$this->add(new MySQL_Column($args[0]));
					break;
				}
			}
		}
		else {
			echo "ERROR : MySQL_Columns::column requires 1 parameter at least."." File:".__FILE__.", Line:".__LINE__; die;
		}
	}
	function sqlize() {
		$sqlFrag = new MySQL_QueryFragment();

		if ($this->length) {
			$columns = array();
			$params = array();
			foreach($this->data as $column) {
				$field = $column->field;
				if (is_object($field)) {
					if ($field instanceof MySQL_Field) {
						$field = $field->sqlize()->queryString;
					}
					elseif ($field instanceof MySQL_Function) {
						$sqlFrag_subquery = $field->sqlize();
						$param = $sqlFrag_subquery->params;
						$field = $sqlFrag_subquery->queryString;
					}
					elseif ($field instanceof MySQL_Query) {
						$field->queryType = "select";
						$sqlFrag_subquery = $field->sqlize();
						$field = "(".$sqlFrag_subquery->queryString.")";
						$param = $sqlFrag_subquery->params;
					}
					elseif ($field instanceof MySQL_RawSQL) {
						$field = $field->sql;
					}
				}
				elseif (is_string($field)) {
					$field = "`".removeSpecials($column->field)."`";
				}
				if ($column->alias) {
					$alias = removeSpecials($column->alias);	
					$field .= (" as `".$alias."`");
				}
				array_push($columns, $field);
				
				if (is_array($param)) {
					$params = array_merge($params, $param);
				}		
			}

			$sqlFrag->queryString = join(", ", $columns);
			$sqlFrag->params = $params;
		}
		else {
			$sqlFrag->queryString = ALL;
		}

		return $sqlFrag;
	}
	function getColumnNames() {
		$columnNames = array();
		if (count($this->data)) {
			foreach($this->data as $column) {
				array_push($columnNames, ($column->alias?$column->alias:$column->field));
			}
		}
		return $columnNames;
	}
}

class MySQL_RawSQL {
	public $sql;
	function __construct($sql) {
		$this->sql = $sql;
	}
}
function rawSQL($sql) {
	return new MySQL_RawSQL($sql);
}


/* MySQL_Value, MySQL_Values */
class MySQL_Value {
	public $fieldname = "";
	public $value = "";

	function __construct($fieldname, $value) {
		if ($fieldname != "") {
			$this->fieldname = $fieldname;
			$this->value = $value;
		}
		else {
			echo "ERROR : $fieldname can not be empty."." File:".__FILE__.", Line:".__LINE__; die;
			die;
		}
	}
}
class MySQL_Values extends FW_List {

	function __construct(/* $array_values */) {
		if ($num_args = func_num_args()) {
			if ($num_args == 1 && is_array($values = func_get_arg(0))) {
				foreach ($values as $key => $value) {
					$this->newValue($key, $value);
				}
			}
			else {
				throw new exception("MySQL_Values::__construct() requires only 1 argument as array.");			
			}
		}
	}

	public $ignoreEmpty = false;

	function newValue($fieldname, $value) {
		$this->add(new MySQL_Value($fieldname, $value));
	}

	function sqlize() {
		if ($this->length > 0) {
			$args = func_get_args();
			if (count($args) <= 1) {
				$sqlFrag = new MySQL_QueryFragment();

				switch ($args[0]) {
					case "insert" : {
						$subString_markers = array();
						$subString_fields = array();
						foreach($this->data as $value) {
							if ((!$this->ignoreEmpty) || ($this->ignoreEmpty && $value->value != "")) {
								array_push($subString_fields, ("`".removeSpecials($value->fieldname)."`"));
								array_push($subString_markers, "?");
								$sqlFrag->addParam($value->value);
							}
						}
						$sqlFrag->queryString = ("(".join(", ", $subString_fields).") values (".join(", ", $subString_markers).")");
						break;
					}
					case "update" :
					default : {
						$subStrings = array();
						foreach($this->data as $value) {
							if ((!$this->ignoreEmpty) || ($this->ignoreEmpty && $value->value != "")) {
								array_push($subStrings, ("`".removeSpecials($value->fieldname)."`=?"));
								$sqlFrag->addParam($value->value);
							}
						}
						$sqlFrag->queryString = join(", ", $subStrings);				
					}
				}

				return $sqlFrag;		
			}
			else {
				echo "ERROR : MySQL_Values::sqlize() requires 0 or 1 argument."." File:".__FILE__.", Line:".__LINE__; die;
			}
		}
		return false;
	}
}

/*
	MySQL_Condition::field
	MySQL_Condition::operator
	MySQL_Condition::value
*/
class MySQL_Condition {
	public $field = "";
	public $operator = "=";
	public $value = "";

	function __construct($field, $operator, $value) {
		if (!is_object($field)) {
			$field = removeSpecials($field);
		}
		$this->field = $field;

		if (is_string($operator)) {
			$this->operator = $operator;
		}
		else {
			throw new exception("MySQL_Condition::\$operator must be a string.");
		}

		if (!is_object($value)) {
			$value = $value;//removeSpecials($value);
		}
		$this->value = $value;
	}
	function __set($propName, $value) {
		if (property_exists($this, $propName)) {
			switch ($propName) {
				case "field" : {
					if (!is_object($value)) {
						$value = $value;//removeSpecials($value);
					}
					$this->field = $value;
					break;
				}
				case "operator" : {
					if (is_string($value)) {
						$this->operator = $value;
					}
					else {
						throw new exception("MySQL_Condition::\$operator must be a string.");
					}
					break;
				}
				case "value" : {
					if (!is_object($value)) {
						$value = $value;//removeSpecials($value);
					}
					$this->value = $value;
					break;
				}
			}
		}
	}
}
/*
	MySQL_ConditionGroup::sqlize()
*/
class MySQL_ConditionGroup extends FW_List {
	function sqlize() {
		if ($this->length > 0) {
			$queryString = array();
			$params = array();
			$sqlFrag = new MySQL_QueryFragment();
			foreach($this->data as $condition) {
				$field = $condition->field;
				$operator = $condition->operator;
				$value = $condition->value;

				if (is_object($field)) {
					if ($field instanceof MySQL_Field) {
						$field = $field->sqlize()->queryString;
					}
				}
				if (is_object($value)) {
					if ($value instanceof MySQL_Field) {
						$value = $value->sqlize()->queryString;
						array_push($queryString, $field." ".removeSpecials($condition->operator).$value);
					}
					elseif ($value instanceof MySQL_Query) {
						$value->queryType = "select";
						$sqlFrag_subquery = $value->sqlize();
						$value = "(".$sqlFrag_subquery->queryString.")";
						$param = $sqlFrag_subquery->params;
						
						array_push($queryString, $field." ".removeSpecials($condition->operator)." ".$value);
						if (is_array($param)) {
							$params = array_merge($params, $param);
						}
					}
				}
				else {
					array_push($queryString, $field." ".removeSpecials($condition->operator)." ?");
					$params[count($params)] = &$condition->value;
				}

			}
			$queryString = count($queryString)?("(".join(" and ", $queryString).")"):"";

			$sqlFrag->queryString = $queryString;
			$sqlFrag->params = $params;
			return $sqlFrag;
		}
		return false;
	}	
}

/*
	# MySQL_Conditions

	MySQL_Conditions::currentGroup
	MySQL_Conditions::newCondition()
	MySQL_Conditions::newConditionGroup()
	MySQL_Conditions::clear()
	MySQL_Conditions::sqlize()
*/
class MySQL_Conditions extends FW_List {
	
	public $currentGroup = 0;

	function __construct() {
		$this->add(new MySQL_ConditionGroup());
	}

	function newConditionGroup() {
		array_push($this->data, new MySQL_ConditionGroup());
		$this->currentGroup++;
	}
	function newCondition($field, $operator, $value) {
		$this->data[$this->currentGroup]->add(new MySQL_Condition($field, $operator, $value));
	}

	function clear() {
		unset($this->data);
		$this->data = array();
	}

	function sqlize() {
		$sqlFrag = new MySQL_QueryFragment();
		if (($this->length != 0) && ($this->data[0]->length != 0)) {
			$queryString_conditions = array();
			$params = array();
			foreach($this->data as $conditionGroup) {
				if ($map_conditionGroup = $conditionGroup->sqlize()) {
					array_push($queryString_conditions, $map_conditionGroup->queryString);
					$params = array_merge($params, $map_conditionGroup->params);
				}
			}
			$sqlFrag->queryString = (join(" or ", $queryString_conditions));
			$sqlFrag->params = $params;
		}
		if ($sqlFrag->queryString) {
			return $sqlFrag;
		}
		else {
			false;
		}
	}
}

/*
	MySQL_Limit::start
	MySQL_Limit::num_rows
	MySQL_Limit::sqlize()
*/
class MySQL_Limit {

	public $start = null;
	public $num_rows = 0;

	function sqlize() {
		$sqlFrag = new MySQL_QueryFragment();
		if (($this->start !== null) && is_int($this->start) && $this->num_rows) {
			$sqlFrag->queryString = " limit ?,?";
			$sqlFrag->addParam($this->start);
			$sqlFrag->addParam($this->num_rows);
		}
		else if($this->num_rows) {
			$sqlFrag->queryString = " limit ?";
			$sqlFrag->addParam($this->num_rows);	
		}
		else {
			$sqlFrag->queryString = "";			
		}
		return $sqlFrag;
	}
}

function getTypeStringFromArray($array) {
	$dataTypes = "";
	foreach($array as $value) {
		if (preg_match("/^\d+$/", $value)) {
			if (preg_match("/^0+\d+$/", $value)) {
				$dataTypes .= "s";				
			}
			else {
				$dataTypes .= "i";
			}
		}
		elseif (preg_match("/^\d+\.\d+$/", $value)) {
			$dataTypes .= "d";				
		}
		elseif (preg_match("/^[\w|\W|\d]+$/", $value)) {
			$dataTypes .= "s";				
		}
		else {
			$dataTypes .= "s";
		}
	}
	return $dataTypes;
}

?>