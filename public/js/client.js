$(document).ready(function() {

    try {
        var socket = io.connect();

        // Recibido del servidor un nuevo mensaje
        socket.on('newTweet', function(tweet) {
            var nick = '#' + tweet.user.screen_name;
            var name = tweet.user.name;
            var photo = tweet.user.profile_image_url;
            var text = tweet.text;


            var d = new Date(tweet.created_at);
            var hour = d.getHours().toString(); if (hour.length == 1) hour = "0" + hour; 
            var minu = d.getMinutes().toString(); if (minu.length == 1) minu = "0" + minu;

            var date = hour + ":" + minu;

            $("#lista_tweets").append('<li><img src="' + photo + '"> <span class="nick">' + nick + '</span> <span class="name">' + name + '</span> <span class="date">' + date + '</span> <p>' + text + '</p></li>');
            $(".content").animate({ scrollTop: $('.content')[0].scrollHeight}, 100);
        });

        $("#send_tweet").click(function() {
            socket.emit('saveTweet', $("#text_tweet").val());
            $("#text_tweet").val("");
        });
    }
    catch(ex) {
        window.open('http://www.google.com');
    }


});
