(function(){
    class Companies {
        constructor(numResult, btnContainer){
            this.numResult = numResult;
            this.btnContainer = btnContainer;
            this.companiesAPI = "https://recruitment.hal.skygate.io/companies";
            this.companyAPI = "https://recruitment.hal.skygate.io/incomes/";
            this.tableBody = document.querySelector(".table-body");
            this.index = 0;
            this.numOfPages = 0;
            this.dataOnPages = [];
            this.data = [];
            this.isSort = true;
            this.html = "";
            this.getAllCompanies("id");
        }

        // change page index
        changeIndex(type) {
            if(type === "next") {
                this.index++;
            } else {
                this.index--;
            }
        }

        //clear table
        clearPage() {
            this.tableBody.innerHTML = "";
        }

        //display buttons on page
        displayButtons() {    
            this.btnContainer.innerHTML = `
                ${this.index ? '<button class="btn-prev" data-name="prev">Previous page</button>' : ''}
                ${this.index < this.numOfPages -1 ? '<button class="btn-next" data-name="next">Next page</button>' : ""}
            `
        };

        //display data on page
        displayOnPage(page, moreData) { 
            this.html += `
            <tr>
                <td class="table-id">${moreData.id}</td>
                <td>${moreData.name}</td>
                <td>${moreData.city}</td>
                <td>${page.total}</td>
                <td>${page.averageIncome}</td>
                <td>${page.totalMoney}</td>
            </tr>
            `;
        };
      
        //calculation average incomes
        getMoreData(data, page) {
            const number = data.incomes.length;
            let total = 0;
            const sortedData = data.incomes.map(item => {
                    const value = parseFloat(item.value)
                    total += value;
                    const milisecunds = Date.parse(item.date);
                    const date = new Date(milisecunds);
                    const month = date.getMonth();
                    const year = date.getFullYear();
                    return {value: item.value, year, month, milisecunds}
                }).sort((a, b) => b.month - a.month)
                 .sort((a,b) => b.year - a.year)
                 .map(item => item)
                 
            const lastYear = sortedData[0].year;     
            const lastMonth = sortedData[0].month;
            const dateToMilisecunds = new Date(lastYear,lastMonth,1).getTime();
            let totalMoney = 0;
            const monthEarnings = sortedData.filter(item => {
                    if(item.milisecunds >= dateToMilisecunds) {
                        totalMoney += (item.value * 1);
                    }
                });
            totalMoney = totalMoney.toFixed(2) * 1;
            total = total.toFixed(2) * 1;
            const averageIncome = (total/number).toFixed(2) * 1;
            this.data.push({total, totalMoney, averageIncome, ...page});
            return {total, totalMoney, averageIncome}
        }

        // get from api part of companies
        async getDataFromPage(page) {
            for(let i = 0; i < page.length; i++) {
                try {
                    const response = await fetch(`${this.companyAPI}${page[i].id}`);
                    const data = await response.json();
                    const moreData = this.getMoreData(data, page[i]);         
                    this.displayOnPage(moreData, page[i]);
                } catch(error) {
                    console.log(error);  
                }
            }
            this.displayButtons();
            this.tableBody.innerHTML = this.html;
            this.html = "";
        }

        getData() {
            let page = this.dataOnPages[this.index];
            this.getDataFromPage(page);
        }
        
        //count number of pages
        pages(data) {
            this.start = 0;
            this.end = this.numResult;
            this.numOfPages = Math.ceil(data.length/this.numResult);
            this.end = this.start + this.numResult;
            this.dataOnPages = [];
            for(let a = 0; a < this.numOfPages; a++){
            let table = [];

            for(let i = this.start; i < this.end; i++) {
                    table.push(data[i]);
                }
                this.dataOnPages.push(table);
                this.start = this.end;
                this.end = this.end + this.numResult;
                if(this.end >= data.length) {
                    this.end = data.length;
                }
            } 
        }
        
        // sort data
        sortData(data, target) {
            this.clearPage();
            if(target === "id" || target === "total" || target === "totalMoney" || target === "averageIncome") {
                if(this.isSort) {
                    data.sort((a,b) => a[`${target}`] - b[`${target}`]);
                    
                } else if(!this.isSort) {
                    data.sort((a,b) => b[`${target}`] - a[`${target}`]);  
                }
            } else if(target === "name" || target === "city") {
                if(!this.isSort) {
                    data.sort((a,b) => {
                        if(a[`${target}`] > b[`${target}`]) return 1
                        else if(a[`${target}`] < b[`${target}`]) return -1
                        else return 0
                    })
                } else {
                    data.sort((a,b) => {
                        if(a[`${target}`] < b[`${target}`]) return 1
                        else if(a[`${target}`] > b[`${target}`]) return -1
                        else return 0
                    })
                }  
            }
        }

        // get data from api
        async getAllCompanies(target) {
            try {
                const result = await fetch(this.companiesAPI);
                let data = await result.json();
                this.sortData(data,target)
                this.pages(data);
                this.getData();  
            } catch(error) {
                console.log(error);  
            }  
        }
    }

    // start function
    function init(){
        const numResult = 20;
        const btnContainer = document.querySelector(".btn-container");
        const tableHead = document.querySelector(".table-head");
        const companies = new Companies(numResult, btnContainer);
        const tableBody = document.querySelector(".table-body");
        
        // listening for page change buttons
            btnContainer.addEventListener("click", () =>{
                if(event.target.classList.contains("btn-next") || event.target.classList.contains("btn-prev")) {
                    companies.clearPage();
                    companies.changeIndex(event.target.dataset.name);
                    companies.getData();
                    companies.data = [];
                }
            });
        
            // listening for click column header
                tableHead.addEventListener("click",() => {
                    if(event.target.dataset.name === "id" || event.target.dataset.name === "name" || event.target.dataset.name === "city") {
                        companies.isSort = !companies.isSort;
                        companies.getAllCompanies(event.target.dataset.name);
                        companies.index = 0;
                        companies.data = [];
                    } else if(event.target.dataset.name === "total" || event.target.dataset.name === "totalMoney" || event.target.dataset.name === "averageIncome") {
                        companies.isSort = !companies.isSort;
                        companies.sortData(companies.data, event.target.dataset.name);
                        companies.data.forEach(data => companies.displayOnPage(data,data));
                        tableBody.innerHTML = companies.html;
                        companies.html = ""; 
                    }
                });
        }
     
    init();
})()