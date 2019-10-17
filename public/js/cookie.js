//ÚJ COOKIE
    function setCookie(cname, cvalue, exdays) {
      var d = new Date();
      d.setTime(d.getTime() + (exdays*24*60*60*1000));
      var expires = "expires="+ d.toUTCString();
      document.cookie = cname + "=" + encrypt(cvalue) + ";" + expires + ";path=/";
    }

//MEGLÉVŐ COOKIE KERESÉSE
    function getCookie(cname) {
      var name = cname + "=";
      var decodedCookie = decodeURIComponent(document.cookie);
      var ca = decodedCookie.split(';');
      for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
          c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
          return decrypt(c.substring(name.length, c.length));
        }
      }
      return "";
    }

//ÖSSZES COOKIE KIÍRÁSA
    function listCookies() {
        var theCookies = document.cookie.split(';');
        var array = [];
        for (var i = 1 ; i <= theCookies.length; i++) {
            array.push(theCookies[i-1]);
        }
        return array;
    }

//COOKIE TÖRLÉSE
    function deleteCookie(cname) {
        var d = new Date(); //Create an date object
        d.setTime(d.getTime() - (1000*60*60*24)); //Set the time to the past. 1000 milliseonds = 1 second
        var expires = "expires=" + d.toGMTString(); //Compose the expirartion date
        window.document.cookie = cname+"="+"; "+expires;//Set the cookie with name and the expiration date
     
    }

function checkCookie() {
  var user = getCookie("username");
  var password = getCookie("password");
  if (user != "" && password != "") {
    return  {
            'username':user, 
            'password':password
            }
  } else {
    return false
  }
}


function encrypt(word){
  let encryptedWord = [];
  word = word.split("").reverse();
  word.forEach(function(character){
    let newCharacterAscii = parseFloat( character.charCodeAt(0) );
    newCharacterAscii = (((newCharacterAscii-1) / 2) + 135) * 3
    encryptedWord.push(newCharacterAscii)
  });
  encryptedWord = encryptedWord.join("-");
  return encryptedWord
}
function decrypt(word){
  word = word.split('-')
  let decrypedText = [];
  word.forEach(function(number){
    let decrypedNumber = (((number / 3) - 135) * 2) + 1
    decrypedText.push( String.fromCharCode(decrypedNumber) );
  });
  decrypedText = decrypedText.reverse().join("")
  return decrypedText;
}