var request = require('request'),
	cheerio = require('cheerio'),
	config = require('./config.js'),
	fs = require('fs'),
	//You will need to either set up your own
	//config file or directly place your Orchestrate
	//db key in the second set of parentheses 
	db = require('orchestrate')(config.dbKey),
	dbCollectionName = 'dbCollTest';


setInterval(function(){

	var allTeamsArr = [],
		teamAbbrev = [	'atl',
						'bos',
						'bkn',
						'cha',
						'chi',
						'cle',
						'dal',
						'den',
						'det',
						'gsw',
						'hou',
						'ind',
						'lac',
						'lal',
						'mem',
						'mia',
						'mil',
						'min',
						'nor',
						'nyk',
						'okc',
						'orl',
						'phi',
						'pho',
						'por',
						'sac',
						'sas',
						'tor',
						'uta',
						'was'  ];

	function scrapeEachTeam(arr) {
		for(var i = 0; i<arr.length; ++i) {
			var thisTeam = arr[i];
			//Requesting each team's roster page to scrape current lineup
			request('http://sports.yahoo.com/nba/teams/'+thisTeam+'/roster/', function(err,res,body){
				if(!err && res.statusCode == 200){
					var $ = cheerio.load(body),
					//Creating an object for each team's players
						teamObj = { team: "",
									players: [] },
						$team = $('.player','.phatable');

					//Iterating through each player on their team's page
					$team.each(function(){
						//Creating an object for each individual player
						var playerObj = { display_name: ""
										},
							$playerID = $('a', $(this)),
							$player = $playerID.text(),
							$statPage = $playerID.attr('href'),
							fullURL = "http://sports.yahoo.com"+$statPage,
				        	$tr = $(this).parent(),
				        	$td = $('td', $tr);

						playerObj.display_name = $player;
						teamObj.team = $(this).parents('#Main').find('img').attr('alt');
						playerObj.url = fullURL;

						//Iterating through each individual player's details
				        $td.each(function(){
				        	var $playerDetail = $(this).attr('class'),
				        		$detailValue = $(this).text();

				        	if($playerDetail === "position") {
				        		$statsValue = $('.position > abbr').text();
				        		playerObj.position = $detailValue;
				        	}

				        	if ($playerDetail === "number") {
				        		playerObj.uniform_number = $detailValue;
				        	}

				        	if ($playerDetail === "height") {
				        		playerObj.height_formatted = $detailValue;
				        	}

				        	if ($playerDetail === "weight") {
				        		playerObj.weight_lb = $detailValue;
				        	}

				        	if ($playerDetail === "birthplace") {
				        		playerObj.birthplace = $detailValue;
				        	}

				        	if ($playerDetail === "college") {
				        		playerObj.college = $detailValue;
				        	}

				        	if ($playerDetail === "age") {
				        		playerObj.age = $detailValue;
				        	}

				        	if ($playerDetail === "salary") {
				        		playerObj.salary = $detailValue;
				        	}

				        	if ($playerDetail === "experience") {
				        		playerObj.experience = $detailValue;
				        	}
				        })				
						if(playerObj.display_name !== "") { teamObj.players.push(playerObj); };
			        })
					allTeamsArr.push(teamObj)
				}
			})
		}
	}

	scrapeEachTeam(teamAbbrev);

	//Add every player's stats
	setTimeout(function(){
		//Iterate through each team object in the "allTeamsArr"
		allTeamsArr.map(function(team){
			//Iterate through each player object in the team's array
			team.players.map(function(player){
				//Requesting each player's profile page
				request(player.url, function(err,res,body){
					if(!err && res.statusCode == 200){
						var $ = cheerio.load(body),
							$info = $('li','.stat-info'),
							$image = $('img', '.player-image')['0'],
							num = player.url.match(/\d+/),
							imageUrl;

						if($image !== undefined) {
							var playerImage = $image.attribs.style;
							imageUrl = playerImage.match(/http?:\/\/.+?.png/g)[0];
							var imageDir = "img/"+num+".png"; 

							request(imageUrl).pipe(fs.createWriteStream(imageDir));
							player.image = imageDir;
						} else {
							imageUrl = "img/no_image.png";
							player.image = imageUrl;
						}

						player.player_id = num[0];

						$info.each(function(){
				        	var $playerStat = $(this).find('dt'),
				        		$statValue = $playerStat.next().text();
				        	
				        	// if($playerStat === "Games") {
				        	// 	playerObj.gms = $statValue;
				        	// }

				        	if ($playerStat.text() === "Pts") {
				        		player.pts = $statValue;
				        	}

				        	if ($playerStat.text() === "Reb") {
				        		player.reb = $statValue;
				        	}

				        	if ($playerStat.text() === "Ast") {
				        		player.ast = $statValue;
				        	}
				        })
					}
				})
			})
		});
	    console.log(">> Adding Player Stats <<");
	}, 30000);

	//Update the Orchestrate database with the refreshed data
	setTimeout(function(){
		allTeamsArr.map(function(obj){
			db.put(dbCollectionName,obj.team,obj)
			.then(function(result){
				res.end();
			})
			.fail(function(err){
		    	throw err;
				console.log("err: "+err);
				res.end();
			});
		})
		console.log(">>> Updated Database <<<");
	}, 300000);

    console.log("> Running Daily Scrape <");
}, 86400000);//Interval is set to run the entire scraping process every 24 hours









