
//ÚJ COOKIE
    function setCookie(cname, cvalue, exdays) {
      var d = new Date();
      d.setTime(d.getTime() + (exdays*24*60*60*1000));
      var expires = "expires="+ d.toUTCString();
      document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
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
          return c.substring(name.length, c.length);
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