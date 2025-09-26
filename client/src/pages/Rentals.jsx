import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Home, 
  MapPin, 
  Users, 
  TrendingUp,
  Calendar,
  DollarSign,
  Upload,
  FileText,
  BarChart3,
  Target
} from 'lucide-react';
import NBButton from '../components/NBButton';
import NBCard from '../components/NBCard';
import RiskScoreBadge from '../components/RiskScoreBadge';
import PerformanceChart from '../components/PerformanceChart';
import receivablesService from '../services/receivablesService';

const Rentals = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [uploadingDocs, setUploadingDocs] = useState(false);

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      const data = await receivablesService.fetchReceivables('rental');
      setProperties(data);
      if (data.length > 0) {
        setSelectedProperty(data[0]);
      }
    } catch (error) {
      console.error('Failed to load properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const mockIncomeData = [
    { date: '2024-07', value: 32000 },
    { date: '2024-08', value: 33500 },
    { date: '2024-09', value: 35000 },
    { date: '2024-10', value: 34800 },
    { date: '2024-11', value: 35200 },
    { date: '2024-12', value: 35000 },
    { date: '2025-01', value: 36000 },
  ];

  const mockOccupancyData = [
    { date: '2024-07', value: 92 },
    { date: '2024-08', value: 95 },
    { date: '2024-09', value: 98 },
    { date: '2024-10', value: 94 },
    { date: '2024-11', value: 96 },
    { date: '2024-12', value: 95 },
    { date: '2025-01', value: 97 },
  ];

  const handleDocumentUpload = async () => {
    setUploadingDocs(true);
    // Simulate upload delay
    setTimeout(() => {
      setUploadingDocs(false);
    }, 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin w-8 h-8 border-4 border-nb-accent border-t-transparent rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="font-display font-bold text-4xl text-nb-ink mb-2">
                Rental Income Streams
              </h1>
              <p className="text-xl text-nb-ink/70">
                Tokenize real estate rental cash flows with stable returns
              </p>
            </div>
            <Link to="/get-cash">
              <NBButton size="lg">
                <Plus size={20} className="mr-2" />
                Add Property
              </NBButton>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-4">
            <NBCard hover={false} padding="sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-nb-accent">
                  ${properties.reduce((sum, p) => sum + p.monthlyIncome, 0).toLocaleString()}
                </div>
                <div className="text-sm text-nb-ink/60">Total Income</div>
              </div>
            </NBCard>
            <NBCard hover={false} padding="sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-nb-ok">
                  {properties.length > 0 ? 
                    Math.round(properties.reduce((sum, p) => sum + p.occupancy, 0) / properties.length) : 0}%
                </div>
                <div className="text-sm text-nb-ink/60">Avg Occupancy</div>
              </div>
            </NBCard>
            <NBCard hover={false} padding="sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-nb-purple">
                  {properties.length}
                </div>
                <div className="text-sm text-nb-ink/60">Properties</div>
              </div>
            </NBCard>
            <NBCard hover={false} padding="sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-nb-accent-2">
                  8.7%
                </div>
                <div className="text-sm text-nb-ink/60">Avg APY</div>
              </div>
            </NBCard>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Property List */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <NBCard>
                <h3 className="font-bold text-lg mb-4">Property Portfolio</h3>
                <div className="space-y-3">
                  {properties.map((property) => (
                    <motion.div
                      key={property.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedProperty?.id === property.id
                          ? 'bg-nb-accent/20 border-2 border-nb-accent'
                          : 'bg-nb-ink/5 hover:bg-nb-accent/10 border-2 border-transparent'
                      }`}
                      onClick={() => setSelectedProperty(property)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center space-x-2">
                          <Home className="text-nb-ok" size={16} />
                          <h4 className="font-semibold text-sm">{property.property.split(',')[0]}</h4>
                        </div>
                        <RiskScoreBadge score={property.riskScore} size="sm" showTooltip={false} />
                      </div>
                      
                      <div className="flex items-center space-x-1 text-xs text-nb-ink/60 mb-2">
                        <MapPin size={12} />
                        <span>{property.location}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-nb-ink/60">Income:</span>
                          <span className="ml-1 font-semibold">${property.monthlyIncome.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-nb-ink/60">Occupancy:</span>
                          <span className="ml-1 font-semibold">{property.occupancy}%</span>
                        </div>
                      </div>
                      
                      <div className={`mt-2 px-2 py-1 rounded text-xs font-semibold ${
                        property.status === 'approved' ? 'bg-nb-ok text-nb-ink' :
                        property.status === 'funded' ? 'bg-nb-accent text-nb-ink' :
                        'bg-nb-warn text-nb-ink'
                      }`}>
                        {property.status === 'approved' ? '✅ Ready to Fund' :
                         property.status === 'funded' ? '💰 Funded' :
                         '⏳ Under Review'}
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                <NBButton variant="outline" className="w-full mt-4">
                  <Plus size={16} className="mr-2" />
                  Add Property
                </NBButton>
              </NBCard>
            </motion.div>
          </div>

          {/* Property Details */}
          <div className="lg:col-span-2 space-y-6">
            {selectedProperty ? (
              <>
                {/* Property Overview */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <NBCard>
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h2 className="font-display font-bold text-2xl text-nb-ink mb-2">
                          {selectedProperty.property}
                        </h2>
                        <div className="flex items-center space-x-4 text-nb-ink/70">
                          <div className="flex items-center space-x-1">
                            <MapPin size={16} />
                            <span>{selectedProperty.location}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar size={16} />
                            <span>Added {new Date(selectedProperty.created).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-nb-accent">
                          ${selectedProperty.monthlyIncome.toLocaleString()}
                        </div>
                        <div className="text-sm text-nb-ink/60">Monthly Income</div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-2">
                          <Users className="text-nb-ok mr-1" size={20} />
                          <span className="text-2xl font-bold text-nb-ok">
                            {selectedProperty.occupancy}%
                          </span>
                        </div>
                        <div className="text-sm text-nb-ink/60">Occupancy Rate</div>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center justify-center mb-2">
                          <TrendingUp className="text-nb-accent-2 mr-1" size={20} />
                          <span className="text-2xl font-bold text-nb-accent-2">
                            +5.2%
                          </span>
                        </div>
                        <div className="text-sm text-nb-ink/60">YoY Growth</div>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center justify-center mb-2">
                          <Target className="text-nb-purple mr-1" size={20} />
                          <span className="text-2xl font-bold text-nb-purple">
                            {((100 - selectedProperty.riskScore) * 0.2 + 7).toFixed(1)}%
                          </span>
                        </div>
                        <div className="text-sm text-nb-ink/60">Target APY</div>
                      </div>
                    </div>
                  </NBCard>
                </motion.div>

                {/* Performance Charts */}
                <motion.div
                  className="grid md:grid-cols-2 gap-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <PerformanceChart
                    title="Monthly Income"
                    data={mockIncomeData}
                    color="#10B981"
                    height={250}
                  />
                  
                  <PerformanceChart
                    title="Occupancy Rate"
                    data={mockOccupancyData}
                    color="#A855F7"
                    height={250}
                  />
                </motion.div>

                {/* Documents & Analysis */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <NBCard>
                    <h3 className="font-bold text-xl mb-6">Property Documentation & Analysis</h3>
                    
                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <h4 className="font-semibold">Required Documents</h4>
                        <div className="space-y-3">
                          {[
                            { name: 'Lease Agreements', status: 'uploaded', icon: FileText },
                            { name: 'Property Deed', status: 'uploaded', icon: FileText },
                            { name: 'Insurance Policy', status: 'uploaded', icon: FileText },
                            { name: 'Rental History', status: 'pending', icon: BarChart3 },
                            { name: 'Property Appraisal', status: 'pending', icon: TrendingUp },
                          ].map((doc, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-nb-ink/5 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <doc.icon size={16} className="text-nb-accent" />
                                <span className="font-medium">{doc.name}</span>
                              </div>
                              <div className={`px-2 py-1 rounded text-xs font-semibold ${
                                doc.status === 'uploaded' ? 'bg-nb-ok text-nb-ink' : 'bg-nb-warn text-nb-ink'
                              }`}>
                                {doc.status === 'uploaded' ? '✅ Uploaded' : '📄 Pending'}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <NBButton 
                          variant="outline" 
                          className="w-full"
                          onClick={handleDocumentUpload}
                          loading={uploadingDocs}
                        >
                          <Upload size={16} className="mr-2" />
                          Upload Documents
                        </NBButton>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-semibold">Risk Assessment</h4>
                        
                        <div className="space-y-3">
                          <div className="p-4 bg-nb-accent/10 rounded-nb">
                            <h5 className="font-semibold mb-2">Location Analysis</h5>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-nb-ink/70">Market Stability:</span>
                                <span className="font-semibold text-nb-ok">High</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-nb-ink/70">Appreciation Rate:</span>
                                <span className="font-semibold">4.2% annually</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-nb-ink/70">Rental Demand:</span>
                                <span className="font-semibold text-nb-ok">Strong</span>
                              </div>
                            </div>
                          </div>

                          <div className="p-4 bg-nb-ok/10 rounded-nb">
                            <h5 className="font-semibold mb-2">Income Projection</h5>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-nb-ink/70">Current Annual:</span>
                                <span className="font-semibold">${(selectedProperty.monthlyIncome * 12).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-nb-ink/70">Projected (3Y):</span>
                                <span className="font-semibold text-nb-accent">${(selectedProperty.monthlyIncome * 12 * 1.16).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-nb-ink/70">Vacancy Risk:</span>
                                <span className="font-semibold">{100 - selectedProperty.occupancy}%</span>
                              </div>
                            </div>
                          </div>

                          <div className="p-4 bg-nb-purple/10 rounded-nb">
                            <h5 className="font-semibold mb-2">Financing Terms</h5>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-nb-ink/70">Max Advance:</span>
                                <span className="font-semibold">${(selectedProperty.monthlyIncome * 18).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-nb-ink/70">Recommended:</span>
                                <span className="font-semibold text-nb-accent">${(selectedProperty.monthlyIncome * 12).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-nb-ink/70">Est. APY:</span>
                                <span className="font-semibold text-nb-purple">
                                  {((100 - selectedProperty.riskScore) * 0.2 + 7).toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {selectedProperty.status === 'approved' && (
                          <NBButton size="lg" className="w-full">
                            <DollarSign size={16} className="mr-2" />
                            Tokenize Property
                          </NBButton>
                        )}
                      </div>
                    </div>
                  </NBCard>
                </motion.div>
              </>
            ) : (
              <NBCard>
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">🏠</div>
                  <h3 className="font-bold text-xl text-nb-ink mb-2">No Properties Connected</h3>
                  <p className="text-nb-ink/70 mb-6">
                    Add your rental properties to access financing and tokenization options.
                  </p>
                  <Link to="/get-cash">
                    <NBButton>
                      <Plus size={16} className="mr-2" />
                      Add First Property
                    </NBButton>
                  </Link>
                </div>
              </NBCard>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Rentals;
