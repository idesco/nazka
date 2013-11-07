<?php
if(!isset($_POST['submit']))
{
	//This page should not be accessed directly. Need to submit the form.
	echo "error; Stuur een bericht via www.nazka.be/contact_nl.html";
}
$name = $_POST['contactName'];
$visitor_email = $_POST['email'];
$message = $_POST['comments'];

//Validate first
if(empty($name)||empty($visitor_email)) 
{
    echo "Naam en e-mail adres invullen aub!";
    exit;
}

if(IsInjected($visitor_email))
{
    echo "Fout e-mail adres!";
    exit;
}

$email_from = 'info@nazka.be';
$email_subject = "Nieuw bericht via nazka.be";
$email_body = "Je hebt een nieuw bericht ontvangen van | $name |\n".
    "BERICHT: \n $message \n".
	"EINDE VAN HET BERICHT. \n".
    
$to = "info@nazka.be";
$headers = "From: $email_from \r\n";
$headers .= "Reply-To: $visitor_email \r\n";
//Send the email!
mail($to,$email_subject,$email_body,$headers);
//done. redirect to thank-you page.
header('Location: /contact_nl_bedankt.html');


// Function to validate against any email injection attempts
function IsInjected($str)
{
  $injections = array('(\n+)',
              '(\r+)',
              '(\t+)',
              '(%0A+)',
              '(%0D+)',
              '(%08+)',
              '(%09+)'
              );
  $inject = join('|', $injections);
  $inject = "/$inject/i";
  if(preg_match($inject,$str))
    {
    return true;
  }
  else
    {
    return false;
  }
}
   
?> 