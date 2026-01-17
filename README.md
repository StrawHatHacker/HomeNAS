> [!WARNING]  
> Strong language, Profanity, Graphic violence against home servers, Hate speech against web frameworks that are not SvelteKit, Partial nudity of PCBs, Promotion of alchohol (we love beer).

### Hop along as I build my home NAS server.
This is probably not something you shouldn't use, and in fact I wonder
why I'm developing it myself, when there are working solutions out there.
The answer is: *because I want to*, and it will be a fun topic that
I can bring up at a party for clout. Not that I get invited to parties but you get the idea. 

This will give me the opportunity to work on something more hands-on instead of making websites all the time!

#### Technologies Used
> Sveltekit, sqlite, docker(soon)

#### Contributions
> Please don't hack me

#### Credits
[Heroicons](https://heroicons.com/)

#### Notes
Architecturally, I'm trying to mimic the file system structure in the database. It would be easier if I could just dump every file in one folder and have the database as the source of truth. But if we ever wanted to FTP a file, we would have to manually add in-which-folder it should-be-under in the database.
Alternatively, I could have the uploads "side effect" their way in the database (using chokindar listeners) instead of adding them on every request. The performance benefit will be negligible though and it could cause race conditions.
