//HA MEGNYOMOD AZ ENTERT EGY INPUTON BELÜL
    $.fn.enterPress = function (fnc) {
        return this.each(function () {
            $(this).keypress(function (ev) {
                var keycode = (ev.keyCode ? ev.keyCode : ev.which);
                if (keycode == '13') {
                    fnc.call(this, ev);
                }
            })
        })
    }
    //PL
    /*
        $('input').enterPress(function(){
				$('.aztCsinaljaMinthaEztNyomtaVolna').trigger('click');
		});
	*/
//RANDOM SZÁM KÉT MEGADOTT SZÁM KÖZÖTT
    function randomBetween(min,max){
        return Math.floor(Math.random()*(max-min+1)+min);
    }
    //PL
    /*
        var randomSzam = randomBetween(2,6);
	*/
//RANDOM ID GENERATOR
    function idGenerator(idLength) {
      var text = "";
      var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    
      for (var i = 0; i < Number(idLength); i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    
      return text;
    }
    //PL
    /*
        var randomId = idGenerator(10);
	*/

//ID GENERATOR WITH DATE
    function idDateGenerator(id_length=8){
        let ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz';
        var d = new Date();
        var id = d.getTime()
        for (var i = 0; i < id_length; i++) {
            id += ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length));
        }
        return id;
    }
    //PL
    /*
        var randomId = idDateGenerator(10);
	*/



