<?php

$productNumber = $_GET['productnumber'];

// Create a stream
$opts = array(
  'http'=>array(
    'method'=>"GET",
    'header'=>"Accept-language: en\r\n" .
              "Cookie: csAgeAndCountry={'age':60,'countrycode':'CA'}\r\n"
  )
);

$context = stream_context_create($opts);

// Open the file using the HTTP headers set above
$data = file_get_contents('https://wwwsecure.us.lego.com/en-us/service/rpservice/getproduct?issalesflow=true&productnumber=' . $productNumber, false, $context);

header('Content-type: application/json');
echo $data;

?>