import express from 'express';
const app = express()
const port = process.env.PORT || 3934

async function fetchLessons(group) {
    try {
        const options = {
            method: 'POST',
            headers: {
                cookie: 'PHPSESSID=1bfd01f1a3f8640780d8a9d916d58f92',
                Accept: '*/*',
                'Accept-Encoding': 'gzip, deflate, br, zstd',
                'Accept-Language': 'en-US,en;q=0.5',
                Connection: 'keep-alive',
                'Content-type': 'application/json; charset=utf-8',
                Cookie: 'PHPSESSID=e4e459d804051cd80e8822c938f765b4',
                Origin: 'https://ktmc.edupage.org',
                Referer: 'https://ktmc.edupage.org/',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-origin',
                'Sec-GPC': '1',
                TE: 'trailers',
                'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:142.0) Gecko/20100101 Firefox/142.0'
            },
            body: '{"__args":[null,"221",{"op":"fetch","needed_part":{"classes":["id","name"]}}],"__gsh":"00000000"}'
        };

        const response = await fetch("https://ktmc.edupage.org/timetable/server/regulartt.js?__func=regularttGetData", options)
            .then(response => response.json())
            .catch(err => console.error(err))
        
        const tables = response.r.dbiAccessorRes.tables
        function getFromTable(t, keyName, keyValue) {
            return t.find(row => row[keyName] === keyValue) || null
        }

        function binaryToCoordinate(binStr) {
            return binStr.indexOf("1") + 1;
        }

        const fetchedClasses = getFromTable(tables, "id", "classes")
        const classData = getFromTable(fetchedClasses.data_rows, "name", group)

        const subjects = getFromTable(tables, "id", "subjects")
        const lessons = getFromTable(tables, "id", "lessons")
        const cards = getFromTable(tables, "id", "cards")

        let validLessons = {}
        for (let i = 0; i < lessons.data_rows.length; i++) {
            const lessonData = lessons.data_rows[i]
            if (lessonData.classids.includes(classData.id)) {
                const subject = getFromTable(subjects.data_rows, "id", lessonData.subjectid)
                const cardsForLesson = cards.data_rows.filter(c => c.lessonid === lessonData.id)

                for (const card of cardsForLesson) {
                    const dayNum = binaryToCoordinate(card.days)

                    let day = validLessons[dayNum] || {}
                    day[card.period] = subject

                    validLessons[dayNum] = day
                }
            }
        }
        return validLessons
    } catch(e) {
        console.error(e)
    }
}

app.get("/:id", (req, res) => {
    const id = req.params.id.toUpperCase()
    fetchLessons(id).then(result => {
        res.json(result)
    }).catch(err => console.error(err))
})

app.listen(port, () => {
    console.log(`listening at http://localhost:${port}`)
})

export default app;
