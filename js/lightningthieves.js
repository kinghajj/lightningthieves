$(function() {
  $(".alert").hide();
  var status = $("#status");
  status.text('Connecting to news stream...');
  var socket = io.connect();
  status.text('Waiting to receive first update...');
  socket.on('news', function(stats) {
    var then = new Date(stats.now);
    var now  = new Date();
    status.text('Last update received at ' + now.toLocaleTimeString() +
                '; current as of ' + then.toLocaleTimeString());

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

    var confirmed_rewards_ltc = stats.ktr.confirmed_rewards * 1;
    var estimated_rewards_ltc = stats.ktr.estimated_rewards * 1;
    var payout_history_ltc    = stats.ktr.payout_history    * 1;
    var confirmed_rewards_btc = confirmed_rewards_ltc       * last_ltcbtc;
    var estimated_rewards_btc = estimated_rewards_ltc       * last_ltcbtc;
    var payout_history_btc    = payout_history_ltc          * last_ltcbtc;
    var confirmed_rewards_usd = confirmed_rewards_ltc       * last_ltcusd;
    var estimated_rewards_usd = estimated_rewards_ltc       * last_ltcusd;
    var payout_history_usd    = payout_history_ltc          * last_ltcusd;

    $("#hashrate").text(stats.ktr.hashrate);
    $("#last_ltcbtc").text(last_ltcbtc);
    $("#last_ltcusd").text(last_ltcusd);
    $("#last_btcusd").text(last_btcusd);

    $("#confirmed_rewards_ltc").text(confirmed_rewards_ltc);
    $("#estimated_rewards_ltc").text(estimated_rewards_ltc);
    $("#payout_history_ltc")   .text(payout_history_ltc);
    $("#confirmed_rewards_btc").text(confirmed_rewards_btc);
    $("#estimated_rewards_btc").text(estimated_rewards_btc);
    $("#payout_history_btc")   .text(payout_history_btc);
    $("#confirmed_rewards_usd").text(confirmed_rewards_usd);
    $("#estimated_rewards_usd").text(estimated_rewards_usd);
    $("#payout_history_usd")   .text(payout_history_usd);
  });
});
