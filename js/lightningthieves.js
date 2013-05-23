var stats;
var converter;

// only display up to four decimal places
function display_money(money) {
    var split = money.toString().split('.');
    split[1] = split[1].substr(0,4);
    return split.join('.');
}

function updatePage() {
  if(!stats) {
    return;
  }

  var then   = new Date(stats.now);
  var now    = new Date();

  // check if workers running, possibly alert user
  var running = true;
  for(var worker in stats.ktr.workers) {
    running = running && stats.ktr.workers[worker].alive;
  }
  if(!running) {
    $("#not-running-error").show();
    $("#running-ok").hide();
  } else {
    $("#not-running-error").hide();
    $("#running-ok").show();
  }

  var last_ltcbtc = stats.btce_ltcbtc.ticker.last  * 1;
  var last_ltcusd = stats.btce_ltcusd.ticker.last  * 1;
  var last_btcusd = stats.mtgox_btcusd.data.last.value * 1;

  $("#btce_ltcbtc").text(last_ltcbtc);
  $("#btce_ltcusd").text(last_ltcusd);
  $("#mtgox_btcusd").text(last_btcusd);

  $("#confirmed_rewards").text(display_money(converter(stats.ktr.confirmed_rewards)));
  $("#estimated_rewards").text(display_money(converter(stats.ktr.estimated_rewards)));
  $("#payout_history").text(display_money(converter(stats.ktr.payout_history)));

  var hash_rate = stats.ktr.hashrate;
  var difficulty = stats.gml_api.difficulty;
  var weekly_income = 50 / difficulty / (Math.pow(2,48)/(Math.pow(2,16)-1)) * Math.pow(10,6) * 60 * 60 * 24 * 7 * (637.0/1000.0);

  $("#hash_rate").text(hash_rate);
  $("#difficulty").text(difficulty);
  $("#weekly_income").text(display_money(converter(weekly_income)));
}

$(function() {
  /* UI init */

  // currency button click handlers
  $("#btn_ltcltc").click(function() {
    converter = function(ltc_amount) {
      return ltc_amount;
    };
    $(".cur-currency").text("LTC");
    updatePage();
  });
  $("#btn_btce_ltcbtc").click(function() {
    converter = function(ltc_amount) {
      return ltc_amount * stats.btce_ltcbtc.ticker.last;
    };
    $(".cur-currency").text("BTC");
    updatePage();
  });
  $("#btn_btce_ltcusd").click(function() {
    converter = function(ltc_amount) {
      return ltc_amount * stats.btce_ltcusd.ticker.last;
    };
    $(".cur-currency").text("USD");
    updatePage();
  });
  $("#btn_mtgox_btcusd").click(function() {
    converter = function(ltc_amount) {
      return ltc_amount * stats.btce_ltcbtc.ticker.last * stats.mtgox_btcusd.data.last.value;
    };
    $(".cur-currency").text("USD");
    updatePage();
  });

  // trigger this to be the default.
  $("#btn_ltcltc").click();

  // currency button tooltips
  $(".exchange-tooltip").tooltip({
    title: "Click to convert the entries in the next table to this currency!",
    placement: 'bottom'
  });

  // hide all alerts until we get some news
  $(".alert").hide();

  var socket = io.connect();
  socket.on('news', function(news) {
    stats = news;
    updatePage();
  });
});
