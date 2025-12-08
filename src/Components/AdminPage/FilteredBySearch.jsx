import React from 'react'
import './FilteredBySearch.css'

const FilteredBySearch = ({ searchTerm, setSearchTerm, ranks, selectedRanks, toggleRank, selectedLayer,
    setSelectedLayer, managementRanks, filteredManagementRanks, selectedManagement, getItemTitle, toggleManagement }) => {

    const showRank = () => {
        // const allBox = document.querySelectorAll('.filter-section>div');
        // allBox.forEach(box => {
        //     box.classList.remove('active-filter-box');
        // });
        const rankDiv = document.querySelector('.for-rank');
        rankDiv.classList.toggle('active-filter-box');
    }
    const showLayer = () => {
        const rankDiv = document.querySelector('.for-layer');
        rankDiv.classList.toggle('active-filter-box');
    }
    const showManagment = () => {
        const rankDiv = document.querySelector('.for-management');
        rankDiv.classList.toggle('active-filter-box');
    }
    return (
        <div className="filters-container">

            <div className="filter-section">
                <input
                    type="text"
                    placeholder="Axtar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="filter-section">
                <h4 onClick={showRank}>Rütbələr</h4>
                <div className='for-rank'>
                    {ranks.map(r => (
                        <label key={r.id}>
                            <input type="checkbox" checked={selectedRanks.includes(r.id)} onChange={() => toggleRank(r.id)} />
                            {r.description}
                        </label>
                    ))}
                </div>
            </div>

            <div className="filter-section">
                <h4 onClick={showLayer}>Təbəqə</h4>
                <div className='for-layer'>
                    <select value={selectedLayer} onChange={e => setSelectedLayer(e.target.value)}>
                        <option value="">Aid olduğu qurum</option>
                        {managementRanks.map(m => (
                            <option key={m.id} value={m.id}>{m.desc}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="filter-section">
                <h4 onClick={showManagment}>Qurumlar</h4>
                <div className='for-management'>
                    {filteredManagementRanks.map(item => (
                        <label key={item.id}>
                            <input type="checkbox" checked={selectedManagement.includes(item.id)} onChange={() => toggleManagement(item.id)} />
                            {getItemTitle(item)}
                        </label>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default FilteredBySearch