<?php

//https://wwwsecure.us.lego.com/en-US/service/rpservice/getcountryinfo?country=CA

$getitemordesign = $_GET['getitemordesign'];
$country = $_GET['country'];

//Default value
if (!isset($country) || $country == "") {
	$country = "CA";
}

// Create a stream
$opts = array(
  'http'=>array(
    'method'=>"GET",
    'header'=>"Accept-language: en\r\n" .
              "Cookie: csAgeAndCountry={'age':60,'countrycode':'".$country."'}\r\n"
  )
);

$context = stream_context_create($opts);

// Open the file using the HTTP headers set above
$data = file_get_contents('https://wwwsecure.us.lego.com/en-US/service/rpservice/getitemordesign?isSalesFlow=true&itemordesignnumber=' . $getitemordesign, false, $context);

header('Content-type: application/json');
echo $data;

?>