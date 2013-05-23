var stats;
var converter;

function updatePage() {
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

  $("#hash_rate").text(stats.ktr.hashrate);
  $("#confirmed_rewards").text(converter(stats.ktr.confirmed_rewards));
  $("#estimated_rewards").text(converter(stats.ktr.estimated_rewards));
  $("#payout_history").text(converter(stats.ktr.payout_history));
}

$(function() {
  /* UI init */

  // currency button click handlers
  $("#btn_ltcltc").click(function() {
    converter = function(ltc_amount) {
      return ltc_amount;
    };
    $(".cur-currency").text("LTC");
    if(stats)
      updatePage();
  });
  $("#btn_btce_ltcbtc").click(function() {
    converter = function(ltc_amount) {
      return ltc_amount * stats.btce_ltcbtc.ticker.last;
    };
    $(".cur-currency").text("BTCe LTCBTC");
    if(stats)
      updatePage();
  });
  $("#btn_btce_ltcusd").click(function() {
    converter = function(ltc_amount) {
      return ltc_amount * stats.btce_ltcusd.ticker.last;
    };
    $(".cur-currency").text("BTCe LTCUSD");
    if(stats)
      updatePage();
  });
  $("#btn_mtgox_btcusd").click(function() {
    converter = function(ltc_amount) {
      return ltc_amount * stats.btce_ltcbtc.ticker.last * stats.mtgox_btcusd.data.last.value;
    };
    $(".cur-currency").text("BTCe LTCBTC -> MtGox BTCUSD");
    if(stats)
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
