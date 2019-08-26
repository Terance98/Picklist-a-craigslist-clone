function GetSelectedItem(item) {
            var e = document.getElementById(item);
            var strUser = e.options[e.selectedIndex].value;
            e.value = strUser;

            // console.log(document.getElementById("category").value);    
            if (strUser === "Community" || strUser === "Services" || strUser === "For sale" || strUser === "Housing" ||
                strUser === "Jobs" || strUser === "Temp jobs") {
                deleteChild();
                createSubcategory(strUser);
            }
            console.log(strUser);

        }

        function deleteChild() {
            var e = document.getElementById("subcategory");
            e.innerHTML = "";
        }

        function createSubcategory(category) {
            switch (category) {
                case "Community":
                    // code block
                    var list = ["activities",
                        "artists",
                        "car pools",
                        "childcare",
                        "classes",
                        "events",
                        "general",
                        "groups",
                        "local news",
                        "lost + found",
                        "missed connections",
                        "musicians",
                        "pets",
                        "politics",
                        "rants & raves",
                        "volunteers"
                    ];
                    break;
                case "Services":
                    // code block
                    var list = ["beauty",
                        "cars/automotive",
                        "cell/mobile",
                        "computer",
                        "creative",
                        "cycle",
                        "event",
                        "farm+garden",
                        "financial",
                        "household",
                        "housing/real estate",
                        "labour/move",
                        "legal",
                        "lessons",
                        "marine",
                        "pet",
                        "skilled trade",
                        "sm biz ads",
                        "travel/hol",
                        "write/ed/tran"
                    ];
                    break;
                case "For sale":
                    var list = ["antiques", "appliances", "arts+crafts", "atv/utv/sno", "auto", "parts", "aviation",
                        "baby+kid", "barter", "beauty+hlth", "bike", "parts", "bikes", "boat", "parts", "boats",
                        "books", "business", "caravn+mtrhm", "cars+vans", "cds/dvd/vhs", "clothes+acc",
                        "collectibles", "computer", "parts", "computers", "electronics", "farm+garden", "free",
                        "furniture", "garage", "sale", "general", "heavy", "equip", "household", "jewellery",
                        "materials", "mobile", "phones", "motorcycle", "parts", "motorcycles", "music", "instr",
                        "photo+video", "sporting", "tickets", "tools", "toys+games", "trailers", "video", "gaming",
                        "wanted", "wheels+tires"
                    ];
                    break;
                case "Housing":
                    var list = ["flats/housing", "holiday", "rentals", "housing/real estate for sale",
                        "housing swap", "housing wanted", "office/commercial", "parking/storage",
                        "rooms/shared", "rooms", "wanted", "sub-lets/temporary"
                    ];
                    break;
                case "Jobs":
                    var list = ["accounting+finance", "admin/office", "arch/engineering", "art/media/design",
                        "biotech/science", "business/mgmt", "customer", "services", "education", "etc/misc",
                        "food/bev/hosp", "general", "labour", "government", "housing/real", "estate", "human",
                        "resources", "legal/paralegal", "manufacturing", "marketing/pr/ad",
                        "medical/health", "non-profit", "sector", "retail/wholesale", "sales",
                        "biz", "dev", "salon/spa/fitness", "security", "skilled", "trade",
                        "craft", "software/qa/dba", "systems/network", "technical", "support", "transport",
                        "tv/film/video", "web/info", "design", "writing/editing"
                    ];
                    break;
                case "Temp jobs":
                    var list = ["computer", "creative", "crew", "domestic", "event", "labour", "talent", "writing"];

                default:
                    // code block
                    console.log("No items");
            }
            list.forEach(element => {
                var option = document.createElement('option');
                // message.setAttribute('class', 'chat-message');
                option.textContent = element;
                subcategory.appendChild(option);
                subcategory.insertBefore(option, subcategory.lastChild);
            });
        }