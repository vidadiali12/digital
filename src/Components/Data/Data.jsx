export const mainUsers = [
    {
        id: 1,
        name: 'Vidadi',
        surname: 'Əlizadə',
        father: 'İnşalla',
        rank: 'əsgər',
        position: 'Developer',
        department: 'MNK',
        unit: 'MNK',
        userName: 'vidadi.alizade',
        password: 'User123!',
        isAdmin: false
    },
    {
        id: 2,
        name: 'Ələkbər',
        surname: 'Ziyalı',
        father: 'Teymur',
        rank: 'polkovnik leytenant',
        position: 'İdarə müdiri',
        department: 'MNK',
        unit: '',
        userName: 'elekber.ziyali',
        password: 'User123!',
        isAdmin: true
    },
    {
        id: 3,
        name: 'Teymur',
        surname: 'Əliyev',
        father: 'Qafar',
        rank: 'kapitan',
        position: 'İdarə müdiri',
        department: 'QQ',
        unit: '',
        userName: 'teymur.aliyev',
        password: 'User123!',
        isAdmin: true
    },
    {
        id: 4,
        name: 'Seymur',
        surname: 'Vəliyev',
        father: 'Elmar',
        rank: 'kapitan',
        position: 'Yeni ish',
        department: 'QQ',
        unit: 'QQ',
        userName: 'seymur.veliyev',
        password: 'User123!',
        isAdmin: false
    },
    {
        id: 4,
        name: 'Qasım',
        surname: 'Qurbanov',
        father: 'Ayaz',
        rank: 'leytenant',
        position: 'Yeni ish',
        department: 'QQ',
        unit: '777',
        userName: 'qasim.qurbanov',
        password: 'User123!',
        isAdmin: false
    },
    {
        id: 5,
        name: 'Vüsal',
        surname: 'Şahbazov',
        father: 'Rəhim',
        rank: 'baş leytenant',
        position: 'Yeni ish',
        department: 'MNK',
        unit: 'MNK',
        userName: 'vusal.shahbazov',
        password: 'User123!',
        isAdmin: false
    }
]

export const accountsType = [
    {
        id: 0,
        typeName: "Çapar istifadəçisi",
        department: true,
        father: false,
        name: false,
        phoneNumber: true,
        password: true,
        position: true,
        rank: true,
        surname: false,
        unit: true,
        userName: true,
        serialNumber: false,
        memory: false,
        brand: false
    },
    {
        id: 1,
        typeName: "İnternet istifadəçisi",
        department: true,
        father: true,
        name: true,
        phoneNumber: false,
        password: false,
        position: true,
        rank: true,
        surname: true,
        unit: true,
        userName: true,
        serialNumber: false,
        memory: false,
        brand: false
    },
    {
        id: 2,
        typeName: "Məlumat daşıyıcısı",
        department: true,
        father: true,
        name: false,
        phoneNumber: false,
        password: false,
        position: true,
        rank: true,
        surname: true,
        unit: true,
        userName: true,
        serialNumber: true,
        memory: true,
        brand: false
    },
    {
        id: 3,
        typeName: "mmu.edu.az",
        department: true,
        father: true,
        name: true,
        phoneNumber: false,
        password: false,
        position: true,
        rank: true,
        surname: false,
        unit: true,
        userName: true,
        serialNumber: false,
        memory: false,
        brand: false
    }
]


export const accountsRank = [
    {
        id: 0,
        rankName: "əsgər"
    },
    {
        id: 1,
        rankName: "gizir"
    },
    {
        id: 2,
        rankName: "leytenant"
    },
    {
        id: 3,
        rankName: "kapitan"
    },
    {
        id: 4,
        rankName: "mayor"
    },
    {
        id: 5,
        rankName: "polkovnik leytenant"
    }
]

export const accountsDepartments = [
    {
        id: 0,
        departmentDescription: "Müdafiə Nazirinin Katibliyi",
        departmentName: "MNK"
    },
    {
        id: 1,
        departmentDescription: "Quru Qoşunları",
        departmentName: "QQ"
    },
    {
        id: 2,
        departmentDescription: "545 - Kibertəhlükəsizlik xidməti",
        departmentName: "KTX"
    }
]

export const accountsUnits = [
    {
        id: 0,
        departmentsId: "0",
        unitDescription: "Müdafiə Nazirinin Katibliyi",
        unitName: "MNK"
    },
    {
        id: 1,
        departmentsId: "1",
        unitDescription: "Quru Qoşunları",
        unitName: "QQ"
    },
    {
        id: 2,
        departmentsId: "1",
        unitDescription: "777 h\h",
        unitName: "777"
    },
    {
        id: 3,
        departmentsId: "2",
        unitDescription: "545 - Kibertəhlükəsizlik xidməti",
        unitName: "KTX"
    },
    {
        id: 4,
        departmentsId: "2",
        unitDescription: "Kibertəhlükəsizlik Mərkəzi",
        unitName: "KTM"
    }
]


export const mainData = localStorage.getItem('documentFormData') ? JSON.parse(localStorage.getItem('documentFormData')) : []
export const signedData = localStorage.getItem('signedData') ? JSON.parse(localStorage.getItem('signedData')) : []